package com.localgo.service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
import com.localgo.dto.request.BookingRequest;
import com.localgo.dto.request.PaymentSelectionRequest;
import com.localgo.dto.request.StatusUpdateRequest;
import com.localgo.dto.response.BookingResponse;
import com.localgo.enums.BookingStatus;
import com.localgo.enums.NotificationType;
import com.localgo.enums.PaymentStatus;
import com.localgo.exception.BadRequestException;
import com.localgo.exception.BookingConflictException;
import com.localgo.exception.ForbiddenException;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.exception.UnauthorizedException;
import com.localgo.model.BookingDoc;
import com.localgo.model.ProviderDoc;
import com.localgo.model.ProviderServiceItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
@Slf4j
public class BookingService {

    public static final long REQUEST_EXPIRY_MS = 10 * 60_000L;

    private final Firestore firestore;
    private final NotificationService notificationService;
    private final SecureRandom secureRandom = new SecureRandom();

    public BookingService(Firestore firestore) {
        this(firestore, null);
    }

    @Autowired
    public BookingService(Firestore firestore, NotificationService notificationService) {
        this.firestore = firestore;
        this.notificationService = notificationService;
    }

    /**
     * Problem 3b: Booking conflict detection inside a Firestore transaction.
     * 1. Query bookings where providerId == X, scheduledDate == requestedDate, and status in [ACCEPTED, ON_THE_WAY, ARRIVED, IN_PROGRESS].
     * 2. Perform time-window overlap comparison in Java:
     *    overlap iff reqStart < existEnd && existStart < reqEnd.
     * 3. Throw BookingConflictException on overlap to abort transaction.
     * 4. Otherwise atomically write new booking with amount in integer paise.
     */
    public BookingResponse createBooking(BookingRequest request, String customerId) {
        try {
            BookingResponse created = firestore.runTransaction(transaction -> {
                String requestedDateStr = request.getScheduledDate().toString();
                LocalTime reqStart = request.getScheduledTime();
                int reqDuration = (request.getEstimatedDurationMins() != null && request.getEstimatedDurationMins() > 0)
                        ? request.getEstimatedDurationMins()
                        : 60;
                LocalTime reqEnd = reqStart.plusMinutes(reqDuration);

                // 1. Transactional check for existing active bookings
                Query conflictQuery = firestore.collection("bookings")
                        .whereEqualTo("providerId", request.getProviderId())
                        .whereEqualTo("scheduledDate", requestedDateStr)
                        .whereIn("status", List.of("ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS"));

                QuerySnapshot existingBookingsSnap;
                try {
                    existingBookingsSnap = transaction.get(conflictQuery).get();
                } catch (Exception e) {
                    throw new RuntimeException("Error executing conflict query in transaction: " + e.getMessage(), e);
                }

                // 2. In-memory overlap comparison in Java
                for (var doc : existingBookingsSnap.getDocuments()) {
                    String timeStr = doc.getString("scheduledTime");
                    Long dur = doc.getLong("estimatedDurationMins");
                    int existDuration = (dur != null && dur > 0) ? dur.intValue() : 60;

                    if (timeStr != null) {
                        try {
                            LocalTime existStart = LocalTime.parse(timeStr);
                            LocalTime existEnd = existStart.plusMinutes(existDuration);

                            // Interval overlap: reqStart < existEnd AND existStart < reqEnd
                            if (reqStart.isBefore(existEnd) && existStart.isBefore(reqEnd)) {
                                throw new BookingConflictException(
                                        "The selected time slot (" + reqStart + " - " + reqEnd +
                                        ") overlaps with an existing booking for this provider on " + requestedDateStr);
                            }
                        } catch (BookingConflictException bce) {
                            throw bce;
                        } catch (Exception ignored) {}
                    }
                }

                // 3. Denormalize customer details
                String customerName = "Customer";
                String customerPhone = "";
                String customerEmail = "";
                try {
                    var customerDoc = transaction.get(firestore.collection("users").document(customerId)).get();
                    if (customerDoc.exists()) {
                        customerName = customerDoc.getString("name");
                        customerPhone = customerDoc.getString("phone");
                        customerEmail = customerDoc.getString("email");
                    }
                } catch (Exception ignored) {}

                // 4. Denormalize provider & service details and compute authoritative price server-side in paise
                String providerName = "Provider";
                String providerPhone = "";
                long amountInPaise;
                var providerDoc = transaction.get(firestore.collection("providers").document(request.getProviderId())).get();
                if (!providerDoc.exists()) {
                    throw new ResourceNotFoundException("Provider not found: " + request.getProviderId());
                }
                providerName = providerDoc.getString("name");
                providerPhone = providerDoc.getString("phone");
                if (providerPhone == null || providerPhone.isBlank()) {
                    try {
                        var privateDoc = transaction.get(firestore.collection("provider_private").document(request.getProviderId())).get();
                        if (privateDoc.exists() && privateDoc.getString("phone") != null) {
                            providerPhone = privateDoc.getString("phone");
                        } else {
                            var provUserDoc = transaction.get(firestore.collection("users").document(request.getProviderId())).get();
                            if (provUserDoc.exists() && provUserDoc.getString("phone") != null) {
                                providerPhone = provUserDoc.getString("phone");
                            }
                        }
                    } catch (Exception ignored) {}
                }

                ProviderDoc p = providerDoc.toObject(ProviderDoc.class);
                ProviderServiceItem matchedService = null;
                if (p != null && p.getServices() != null) {
                    for (ProviderServiceItem item : p.getServices()) {
                        if (request.getServiceId().equalsIgnoreCase(item.getServiceId())) {
                            matchedService = item;
                            break;
                        }
                    }
                }
                if (matchedService == null || matchedService.getStartingPrice() == null || matchedService.getStartingPrice() < 0) {
                    throw new BadRequestException("Selected provider does not offer this service.");
                }
                amountInPaise = matchedService.getStartingPrice();

                String serviceName = matchedService.getServiceName() != null ? matchedService.getServiceName() : "Service";
                try {
                    var serviceDoc = transaction.get(firestore.collection("services").document(request.getServiceId())).get();
                    if (serviceDoc.exists() && serviceDoc.getString("name") != null) {
                        serviceName = serviceDoc.getString("name");
                    }
                } catch (Exception ignored) {}

                // 5. Create new booking doc atomically and isolate startOtp in customer-only secrets subcollection
                String startOtp = String.valueOf(1000 + secureRandom.nextInt(9000));
                DocumentReference newDocRef = firestore.collection("bookings").document();
                BookingDoc newBooking = BookingDoc.builder()
                        .id(newDocRef.getId())
                        .customerId(customerId)
                        .customerName(customerName)
                        .customerPhone(customerPhone)
                        .providerId(request.getProviderId())
                        .providerName(providerName)
                        .providerPhone(providerPhone != null ? providerPhone : "")
                        .serviceId(request.getServiceId())
                        .serviceName(serviceName)
                        .description(request.getDescription())
                        .latitude(request.getLatitude())
                        .longitude(request.getLongitude())
                        .address(request.getAddress())
                        .scheduledDate(requestedDateStr)
                        .scheduledTime(reqStart.toString())
                        .estimatedDurationMins(reqDuration)
                        .status(BookingStatus.REQUESTED.name())
                        .amount(amountInPaise)
                        .paymentMethod(request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()
                                ? request.getPaymentMethod().trim().toUpperCase()
                                : "PAY_AFTER_SERVICE")
                        .paymentStatus(PaymentStatus.PENDING.name())
                        .startOtp(null)
                        .completionOtp(null)
                        .createdAt(new Date())
                        .build();

                transaction.set(newDocRef, newBooking);
                DocumentReference secretRef = newDocRef.collection("secrets").document("otp");
                transaction.set(secretRef, Map.of(
                        "customerId", customerId,
                        "startOtp", startOtp,
                        "createdAt", new Date()
                ));
                return mapToResponse(newBooking, customerEmail, true, startOtp);
            }).get();

            notifyUser(
                    created.getProviderId(),
                    NotificationType.BOOKING_CREATED,
                    "New Booking Request",
                    String.format("%s requested %s on %s at %s.",
                            created.getCustomerName() != null ? created.getCustomerName() : "A customer",
                            created.getServiceName() != null ? created.getServiceName() : "service",
                            created.getScheduledDate(),
                            created.getScheduledTime()),
                    created.getId()
            );
            return created;
        } catch (ExecutionException e) {
            if (e.getCause() instanceof BookingConflictException bce) {
                throw bce;
            }
            if (e.getCause() instanceof ResourceNotFoundException rnfe) {
                throw rnfe;
            }
            if (e.getCause() instanceof BadRequestException bre) {
                throw bre;
            }
            log.error("Failed to execute booking transaction", e);
            throw new RuntimeException("Error processing booking: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Booking transaction was interrupted");
        }
    }

    public BookingResponse getBookingById(String id, String userId) {
        try {
            var docSnap = firestore.collection("bookings").document(id).get().get();
            if (!docSnap.exists()) {
                throw new ResourceNotFoundException("Booking not found with id: " + id);
            }
            BookingDoc doc = docSnap.toObject(BookingDoc.class);
            if (doc != null) {
                doc.setId(id);
                // Security check
                if (!userId.equals(doc.getCustomerId()) && !userId.equals(doc.getProviderId())) {
                    throw new UnauthorizedException("You are not authorized to view this booking.");
                }
                boolean isCustomer = userId.equals(doc.getCustomerId());
                String startOtp = isCustomer ? resolveStartOtp(id, doc) : null;
                return mapToResponse(doc, null, isCustomer, startOtp);
            }
            throw new ResourceNotFoundException("Booking not found with id: " + id);
        } catch (ResourceNotFoundException | UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch booking {}: {}", id, e.getMessage());
            throw new RuntimeException("Error fetching booking: " + e.getMessage());
        }
    }

    public List<BookingResponse> getCustomerBookings(String customerId) {
        try {
            var snapshot = firestore.collection("bookings")
                    .whereEqualTo("customerId", customerId)
                    .get()
                    .get();

            List<BookingResponse> list = new ArrayList<>();
            for (var doc : snapshot.getDocuments()) {
                BookingDoc b = doc.toObject(BookingDoc.class);
                if (b != null) {
                    b.setId(doc.getId());
                    String otp = null;
                    if (Set.of("REQUESTED", "ACCEPTED", "ON_THE_WAY", "ARRIVED").contains(b.getStatus())) {
                        otp = resolveStartOtp(doc.getId(), b);
                    }
                    list.add(mapToResponse(b, null, true, otp));
                }
            }
            // Sort by createdAt descending
            list.sort((a, b) -> {
                if (a.getCreatedAt() == null) return 1;
                if (b.getCreatedAt() == null) return -1;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });
            return list;
        } catch (Exception e) {
            log.error("Failed to fetch customer bookings for {}: {}", customerId, e.getMessage());
            throw new RuntimeException("Error fetching bookings: " + e.getMessage());
        }
    }

    public BookingResponse cancelBooking(String bookingId, String cancelledBy, String reason) {
        return cancelBooking(bookingId, cancelledBy, reason, false);
    }

    public BookingResponse cancelBooking(String bookingId, String cancelledBy, String reason, boolean callerIsAdmin) {
        try {
            var docRef = firestore.collection("bookings").document(bookingId);
            var snap = docRef.get().get();
            if (!snap.exists()) {
                throw new ResourceNotFoundException("Booking not found: " + bookingId);
            }
            BookingDoc doc = snap.toObject(BookingDoc.class);
            if (doc == null) {
                throw new ResourceNotFoundException("Booking not found: " + bookingId);
            }
            doc.setId(bookingId);

            boolean isParticipant = cancelledBy != null
                    && (cancelledBy.equals(doc.getCustomerId()) || cancelledBy.equals(doc.getProviderId()));
            if (!isParticipant && !callerIsAdmin && !isAdminUser(cancelledBy)) {
                throw new ForbiddenException("You are not authorized to cancel this booking.");
            }

            BookingStatus currentStatus = BookingStatus.valueOf(doc.getStatus());
            if (currentStatus == BookingStatus.COMPLETED
                    || currentStatus == BookingStatus.CANCELLED
                    || currentStatus == BookingStatus.REJECTED
                    || currentStatus == BookingStatus.EXPIRED) {
                throw new BadRequestException("Cannot cancel a booking with status: " + currentStatus);
            }

            doc.setStatus(BookingStatus.CANCELLED.name());
            doc.setCancelledBy(cancelledBy);
            doc.setCancellationReason(reason);
            docRef.set(doc).get();

            String serviceLabel = doc.getServiceName() != null ? doc.getServiceName() : "service";
            String cancelNote = (reason != null && !reason.isBlank()) ? " Reason: " + reason : "";
            if (Objects.equals(cancelledBy, doc.getCustomerId())) {
                notifyUser(doc.getProviderId(), NotificationType.BOOKING_CANCELLED,
                        "Booking Cancelled by Customer",
                        "Customer cancelled the " + serviceLabel + " booking." + cancelNote,
                        bookingId);
            } else if (Objects.equals(cancelledBy, doc.getProviderId())) {
                notifyUser(doc.getCustomerId(), NotificationType.BOOKING_CANCELLED,
                        "Booking Cancelled by Provider",
                        "Your " + serviceLabel + " booking was cancelled by the provider." + cancelNote,
                        bookingId);
            } else {
                notifyUser(doc.getCustomerId(), NotificationType.BOOKING_CANCELLED,
                        "Booking Cancelled",
                        "Your " + serviceLabel + " booking was cancelled by an administrator." + cancelNote,
                        bookingId);
                notifyUser(doc.getProviderId(), NotificationType.BOOKING_CANCELLED,
                        "Booking Cancelled",
                        "A " + serviceLabel + " booking assigned to you was cancelled by an administrator." + cancelNote,
                        bookingId);
            }

            return mapToResponse(doc, null);
        } catch (ResourceNotFoundException | BadRequestException | ForbiddenException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to cancel booking {}: {}", bookingId, e.getMessage());
            throw new RuntimeException("Error cancelling booking: " + e.getMessage());
        }
    }

    public BookingResponse updateBookingStatus(String bookingId, StatusUpdateRequest request, String providerId) {
        try {
            var docRef = firestore.collection("bookings").document(bookingId);
            var snap = docRef.get().get();
            if (!snap.exists()) {
                throw new ResourceNotFoundException("Booking not found: " + bookingId);
            }
            BookingDoc doc = snap.toObject(BookingDoc.class);
            if (doc == null) {
                throw new ResourceNotFoundException("Booking not found: " + bookingId);
            }
            doc.setId(bookingId);

            if (!providerId.equals(doc.getProviderId())) {
                throw new UnauthorizedException("You are not authorized to update this booking.");
            }

            BookingStatus targetStatus = request.getStatus();
            BookingStatus currentStatus = BookingStatus.valueOf(doc.getStatus());

            // Validate status transitions
            validateStatusTransition(currentStatus, targetStatus);

            // Enforce Service Start OTP when transitioning to IN_PROGRESS after arrival
            if (targetStatus == BookingStatus.IN_PROGRESS) {
                String expectedOtp = resolveStartOtp(bookingId, doc);
                if (expectedOtp != null && !expectedOtp.isBlank()) {
                    if (request.getOtp() == null || !request.getOtp().trim().equals(expectedOtp.trim())) {
                        throw new BadRequestException("Invalid Service Start OTP. Please ask the customer for the 4-digit Start OTP.");
                    }
                }
            }

            Date now = new Date();
            doc.setStatus(targetStatus.name());
            if (targetStatus == BookingStatus.ACCEPTED) {
                doc.setAcceptedAt(now);
            } else if (targetStatus == BookingStatus.REJECTED) {
                doc.setCancelledBy(providerId);
                if (request.getCancellationReason() != null) {
                    doc.setCancellationReason(request.getCancellationReason());
                }
            } else if (targetStatus == BookingStatus.ON_THE_WAY) {
                doc.setOnTheWayAt(now);
            } else if (targetStatus == BookingStatus.ARRIVED) {
                doc.setArrivedAt(now);
            } else if (targetStatus == BookingStatus.IN_PROGRESS) {
                doc.setInProgressAt(now);
            } else if (targetStatus == BookingStatus.CANCELLED) {
                doc.setCancelledBy(providerId);
                doc.setCancellationReason(request.getCancellationReason());
            } else if (targetStatus == BookingStatus.COMPLETED) {
                doc.setCompletedAt(now);
                if (request.getExtraCharges() != null && request.getExtraCharges().compareTo(BigDecimal.ZERO) > 0) {
                    long extraPaise = request.getExtraCharges()
                            .multiply(BigDecimal.valueOf(100))
                            .setScale(0, RoundingMode.HALF_UP)
                            .longValue();
                    doc.setExtraAmountPaise(extraPaise);
                }
                if (request.getWorkSummary() != null && !request.getWorkSummary().isBlank()) {
                    doc.setWorkSummary(request.getWorkSummary().trim());
                }
                // Do not auto-mark UPI or CASH as PAID at completion; CASH requires explicit provider confirmation.
                if (doc.getPaymentStatus() == null || doc.getPaymentStatus().isBlank()) {
                    doc.setPaymentStatus(PaymentStatus.PENDING.name());
                }
            }

            docRef.set(doc).get();
            if (targetStatus == BookingStatus.COMPLETED) {
                syncProviderCompletedJobs(providerId);
            }
            sendStatusChangeNotification(doc, targetStatus);
            return mapToResponse(doc, null, false);
        } catch (ResourceNotFoundException | UnauthorizedException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to update status for booking {}: {}", bookingId, e.getMessage());
            throw new RuntimeException("Error updating booking status: " + e.getMessage());
        }
    }

    public BookingResponse submitPaymentSelection(String bookingId, PaymentSelectionRequest request, String customerId) {
        try {
            var docRef = firestore.collection("bookings").document(bookingId);
            var snap = docRef.get().get();
            if (!snap.exists()) {
                throw new ResourceNotFoundException("Booking not found: " + bookingId);
            }
            BookingDoc doc = snap.toObject(BookingDoc.class);
            if (doc == null) {
                throw new ResourceNotFoundException("Booking not found: " + bookingId);
            }
            doc.setId(bookingId);

            if (!Objects.equals(customerId, doc.getCustomerId())) {
                throw new UnauthorizedException("You are not authorized to update payment for this booking.");
            }
            if (!BookingStatus.COMPLETED.name().equalsIgnoreCase(doc.getStatus())) {
                throw new BadRequestException("Payment option can only be selected after the service is completed.");
            }
            if (PaymentStatus.PAID.name().equalsIgnoreCase(doc.getPaymentStatus())) {
                throw new BadRequestException("This booking is already marked as PAID.");
            }

            String method = request.getPaymentMethod() != null ? request.getPaymentMethod().trim().toUpperCase() : "";
            if (!"CASH".equals(method) && !"UPI".equals(method)) {
                throw new BadRequestException("Payment method must be CASH or UPI.");
            }

            String utr = request.getUtr() != null ? request.getUtr().trim() : null;
            if ("UPI".equals(method)) {
                if (utr == null || utr.length() < 6) {
                    throw new BadRequestException("Please enter a valid UTR / transaction reference number (at least 6 characters).");
                }
                doc.setPaymentUtr(utr);
            } else {
                doc.setPaymentUtr(null);
            }

            doc.setPaymentMethod(method);
            doc.setPaymentStatus(PaymentStatus.PENDING.name());
            doc.setPaymentSubmittedAt(new Date());
            docRef.set(doc).get();

            String serviceLabel = doc.getServiceName() != null ? doc.getServiceName() : "service";
            String msg = "UPI".equals(method)
                    ? "Customer submitted UPI payment (UTR: " + utr + ") for " + serviceLabel + ". Please verify and confirm."
                    : "Customer chose Cash payment for " + serviceLabel + ". Confirm once collected.";
            notifyUser(
                    doc.getProviderId(),
                    NotificationType.PAYMENT_CONFIRMED,
                    "UPI".equals(method) ? "Verify UPI Payment" : "Cash Payment Selected",
                    msg,
                    bookingId
            );

            return mapToResponse(doc, null, true, null);
        } catch (ResourceNotFoundException | UnauthorizedException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to submit payment selection for booking {}: {}", bookingId, e.getMessage());
            throw new RuntimeException("Error submitting payment details: " + e.getMessage());
        }
    }

    public BookingResponse confirmCashReceived(String bookingId, String providerId) {
        try {
            var docRef = firestore.collection("bookings").document(bookingId);
            var snap = docRef.get().get();
            if (!snap.exists()) {
                throw new ResourceNotFoundException("Booking not found: " + bookingId);
            }
            BookingDoc doc = snap.toObject(BookingDoc.class);
            if (doc == null) {
                throw new ResourceNotFoundException("Booking not found: " + bookingId);
            }
            doc.setId(bookingId);

            if (!Objects.equals(providerId, doc.getProviderId())) {
                throw new ForbiddenException("You are not authorized to confirm payment for this booking.");
            }
            if (!BookingStatus.COMPLETED.name().equalsIgnoreCase(doc.getStatus())) {
                throw new BadRequestException("Payment can only be confirmed after the booking is COMPLETED.");
            }
            if (doc.getPaymentMethod() == null || "PAY_AFTER_SERVICE".equalsIgnoreCase(doc.getPaymentMethod())) {
                doc.setPaymentMethod("CASH");
            }
            if (!PaymentStatus.PAID.name().equalsIgnoreCase(doc.getPaymentStatus())) {
                doc.setPaymentStatus(PaymentStatus.PAID.name());
                docRef.set(doc).get();
                boolean isUpi = "UPI".equalsIgnoreCase(doc.getPaymentMethod());
                notifyUser(
                        doc.getCustomerId(),
                        NotificationType.PAYMENT_CONFIRMED,
                        isUpi ? "UPI Payment Verified" : "Cash Payment Confirmed",
                        "Your provider verified " + (isUpi ? "UPI" : "cash") + " payment for " + (doc.getServiceName() != null ? doc.getServiceName() : "service") + ".",
                        bookingId
                );
            }
            return mapToResponse(doc, null, false);
        } catch (ResourceNotFoundException | ForbiddenException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to confirm payment receipt for booking {}: {}", bookingId, e.getMessage());
            throw new RuntimeException("Error confirming payment: " + e.getMessage());
        }
    }

    /**
     * Automatically expires REQUESTED bookings unaccepted for more than 10 minutes.
     */
    @Scheduled(fixedDelay = 60_000L)
    public int expireStaleRequestedBookings() {
        int expiredCount = 0;
        try {
            var bookingsCol = firestore.collection("bookings");
            if (bookingsCol == null) return 0;
            var requestedSnap = bookingsCol.whereEqualTo("status", BookingStatus.REQUESTED.name()).get().get();
            if (requestedSnap == null || requestedSnap.isEmpty()) return 0;

            long cutoffMs = System.currentTimeMillis() - REQUEST_EXPIRY_MS;
            for (var docSnap : requestedSnap.getDocuments()) {
                BookingDoc b = docSnap.toObject(BookingDoc.class);
                if (b == null || b.getCreatedAt() == null) continue;
                if (b.getCreatedAt().getTime() <= cutoffMs) {
                    b.setId(docSnap.getId());
                    b.setStatus(BookingStatus.EXPIRED.name());
                    b.setCancellationReason("Booking request expired after 10 minutes without provider acceptance.");
                    docSnap.getReference().set(b).get();
                    expiredCount++;
                    notifyUser(
                            b.getCustomerId(),
                            NotificationType.BOOKING_EXPIRED,
                            "Booking Request Expired",
                            String.format("Your %s request was not accepted within 10 minutes and has expired.",
                                    b.getServiceName() != null ? b.getServiceName() : "service"),
                            b.getId()
                    );
                }
            }
            if (expiredCount > 0) {
                log.info("Auto-expired {} stale REQUESTED bookings.", expiredCount);
            }
        } catch (Exception e) {
            log.warn("Error running stale REQUESTED booking expiry sweep: {}", e.getMessage());
        }
        return expiredCount;
    }

    private void sendStatusChangeNotification(BookingDoc doc, BookingStatus targetStatus) {
        String serviceName = doc.getServiceName() != null ? doc.getServiceName() : "service";
        String providerName = doc.getProviderName() != null ? doc.getProviderName() : "Your provider";
        switch (targetStatus) {
            case ACCEPTED -> notifyUser(doc.getCustomerId(), NotificationType.BOOKING_ACCEPTED,
                    "Booking Accepted", providerName + " accepted your " + serviceName + " booking.", doc.getId());
            case REJECTED -> notifyUser(doc.getCustomerId(), NotificationType.BOOKING_REJECTED,
                    "Booking Declined", providerName + " declined your " + serviceName + " booking request.", doc.getId());
            case ON_THE_WAY -> notifyUser(doc.getCustomerId(), NotificationType.PROVIDER_ON_THE_WAY,
                    "Provider On The Way", providerName + " is on the way for your " + serviceName + " booking.", doc.getId());
            case ARRIVED -> notifyUser(doc.getCustomerId(), NotificationType.PROVIDER_ARRIVED,
                    "Provider Arrived", providerName + " has arrived at your doorstep. Share your 4-digit Start OTP.", doc.getId());
            case IN_PROGRESS -> notifyUser(doc.getCustomerId(), NotificationType.SERVICE_STARTED,
                    "Service Started", providerName + " verified the Start OTP and began " + serviceName + ".", doc.getId());
            case COMPLETED -> notifyUser(doc.getCustomerId(), NotificationType.SERVICE_COMPLETED,
                    "Service Completed", providerName + " marked your " + serviceName + " booking as completed.", doc.getId());
            case CANCELLED -> notifyUser(doc.getCustomerId(), NotificationType.BOOKING_CANCELLED,
                    "Booking Cancelled", providerName + " cancelled your " + serviceName + " booking.", doc.getId());
            default -> {}
        }
    }

    private void notifyUser(String userId, NotificationType type, String title, String message, String bookingId) {
        if (notificationService == null || userId == null || userId.isBlank()) {
            return;
        }
        notificationService.createNotification(userId, type, title, message, bookingId);
    }

    private void validateStatusTransition(BookingStatus current, BookingStatus target) {
        boolean valid = switch (current) {
            case REQUESTED -> target == BookingStatus.ACCEPTED || target == BookingStatus.REJECTED;
            case ACCEPTED -> target == BookingStatus.ON_THE_WAY || target == BookingStatus.CANCELLED;
            case ON_THE_WAY -> target == BookingStatus.ARRIVED || target == BookingStatus.IN_PROGRESS || target == BookingStatus.CANCELLED;
            case ARRIVED -> target == BookingStatus.IN_PROGRESS || target == BookingStatus.CANCELLED;
            case IN_PROGRESS -> target == BookingStatus.COMPLETED;
            default -> false;
        };

        if (!valid) {
            throw new BadRequestException("Invalid status transition from " + current + " to " + target);
        }
    }

    private void syncProviderCompletedJobs(String providerId) {
        try {
            var bookingsCol = firestore.collection("bookings");
            var providersCol = firestore.collection("providers");
            if (bookingsCol == null || providersCol == null) return;
            var completedSnap = bookingsCol
                    .whereEqualTo("providerId", providerId)
                    .whereEqualTo("status", BookingStatus.COMPLETED.name())
                    .get().get();
            int actualCount = completedSnap != null ? completedSnap.size() : 0;
            providersCol.document(providerId).update("completedJobs", actualCount).get();
        } catch (Exception e) {
            log.warn("Failed to sync completed jobs for provider {}: {}", providerId, e.getMessage());
        }
    }

    public BookingResponse mapToResponse(BookingDoc doc, String customerEmail) {
        return mapToResponse(doc, customerEmail, false, null);
    }

    public BookingResponse mapToResponse(BookingDoc doc, String customerEmail, boolean includeOtps) {
        return mapToResponse(doc, customerEmail, includeOtps, doc != null ? doc.getStartOtp() : null);
    }

    public BookingResponse mapToResponse(BookingDoc doc, String customerEmail, boolean includeOtps, String resolvedStartOtp) {
        BigDecimal amountRupees = doc.getAmount() != null
                ? BigDecimal.valueOf(doc.getAmount()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        LocalDate sDate = null;
        if (doc.getScheduledDate() != null) {
            try { sDate = LocalDate.parse(doc.getScheduledDate()); } catch (Exception ignored) {}
        }

        LocalTime sTime = null;
        if (doc.getScheduledTime() != null) {
            try { sTime = LocalTime.parse(doc.getScheduledTime()); } catch (Exception ignored) {}
        }

        BookingStatus parsedStatus = doc.getStatus() != null ? BookingStatus.valueOf(doc.getStatus()) : BookingStatus.REQUESTED;
        boolean exposeProviderPhone = Set.of(
                BookingStatus.ACCEPTED,
                BookingStatus.ON_THE_WAY,
                BookingStatus.ARRIVED,
                BookingStatus.IN_PROGRESS,
                BookingStatus.COMPLETED
        ).contains(parsedStatus);
        String visibleStartOtp = includeOtps
                ? (resolvedStartOtp != null && !resolvedStartOtp.isBlank() ? resolvedStartOtp : doc.getStartOtp())
                : null;

        return BookingResponse.builder()
                .id(doc.getId())
                .customerId(doc.getCustomerId())
                .customerName(doc.getCustomerName())
                .customerPhone(doc.getCustomerPhone())
                .customerEmail(customerEmail)
                .providerId(doc.getProviderId())
                .providerName(doc.getProviderName())
                .providerPhone(exposeProviderPhone ? doc.getProviderPhone() : null)
                .serviceId(doc.getServiceId())
                .serviceName(doc.getServiceName())
                .description(doc.getDescription())
                .latitude(doc.getLatitude())
                .longitude(doc.getLongitude())
                .address(doc.getAddress())
                .scheduledDate(sDate)
                .scheduledTime(sTime)
                .estimatedDurationMins(doc.getEstimatedDurationMins())
                .status(parsedStatus)
                .cancelledBy(doc.getCancelledBy())
                .cancellationReason(doc.getCancellationReason())
                .amount(amountRupees)
                .extraAmount(doc.getExtraAmountPaise() != null
                        ? BigDecimal.valueOf(doc.getExtraAmountPaise()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO)
                .totalAmount(amountRupees.add(doc.getExtraAmountPaise() != null
                        ? BigDecimal.valueOf(doc.getExtraAmountPaise()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO))
                .workSummary(doc.getWorkSummary())
                .paymentMethod(doc.getPaymentMethod())
                .paymentStatus(doc.getPaymentStatus() != null ? PaymentStatus.valueOf(doc.getPaymentStatus()) : PaymentStatus.PENDING)
                .paymentUtr(doc.getPaymentUtr())
                .startOtp(visibleStartOtp)
                .completionOtp(null)
                .acceptedAt(toLocalDateTime(doc.getAcceptedAt()))
                .onTheWayAt(toLocalDateTime(doc.getOnTheWayAt()))
                .arrivedAt(toLocalDateTime(doc.getArrivedAt()))
                .inProgressAt(toLocalDateTime(doc.getInProgressAt()))
                .completedAt(toLocalDateTime(doc.getCompletedAt()))
                .createdAt(toLocalDateTime(doc.getCreatedAt()))
                .build();
    }

    private String resolveStartOtp(String bookingId, BookingDoc doc) {
        if (bookingId != null) {
            try {
                var bookingsCol = firestore.collection("bookings");
                if (bookingsCol != null) {
                    var bookingRef = bookingsCol.document(bookingId);
                    if (bookingRef != null) {
                        var secretsCol = bookingRef.collection("secrets");
                        if (secretsCol != null) {
                            var otpRef = secretsCol.document("otp");
                            if (otpRef != null) {
                                var otpSnap = otpRef.get().get();
                                if (otpSnap != null && otpSnap.exists()) {
                                    String secretOtp = otpSnap.getString("startOtp");
                                    if (secretOtp != null && !secretOtp.isBlank()) {
                                        return secretOtp;
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.debug("Could not read secret OTP for booking {}: {}", bookingId, e.getMessage());
            }
        }
        return doc != null ? doc.getStartOtp() : null;
    }

    private boolean isAdminUser(String uid) {
        if (uid == null || uid.isBlank()) return false;
        try {
            var usersCol = firestore.collection("users");
            if (usersCol == null) return false;
            var userRef = usersCol.document(uid);
            if (userRef == null) return false;
            var snap = userRef.get().get();
            if (snap != null && snap.exists()) {
                return "ADMIN".equalsIgnoreCase(snap.getString("role"));
            }
        } catch (Exception ignored) {}
        return false;
    }

    private LocalDateTime toLocalDateTime(Date date) {
        if (date == null) return null;
        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
    }
}
