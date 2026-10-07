package com.localgo.service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
import com.localgo.dto.request.BookingRequest;
import com.localgo.dto.request.StatusUpdateRequest;
import com.localgo.dto.response.BookingResponse;
import com.localgo.enums.BookingStatus;
import com.localgo.enums.PaymentStatus;
import com.localgo.exception.BadRequestException;
import com.localgo.exception.BookingConflictException;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.exception.UnauthorizedException;
import com.localgo.model.BookingDoc;
import com.localgo.model.ProviderDoc;
import com.localgo.model.ProviderServiceItem;
import com.localgo.model.ServiceDoc;
import com.localgo.model.UserDoc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final Firestore firestore;

    /**
     * Problem 3b: Booking conflict detection inside a Firestore transaction.
     * 1. Query bookings where providerId == X, scheduledDate == requestedDate, and status in [ACCEPTED, ON_THE_WAY, IN_PROGRESS].
     * 2. Perform time-window overlap comparison in Java:
     *    overlap iff reqStart < existEnd && existStart < reqEnd.
     * 3. Throw BookingConflictException on overlap to abort transaction.
     * 4. Otherwise atomically write new booking with amount in integer paise.
     */
    public BookingResponse createBooking(BookingRequest request, String customerId) {
        try {
            return firestore.runTransaction(transaction -> {
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
                        .whereIn("status", List.of("ACCEPTED", "ON_THE_WAY", "IN_PROGRESS"));

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

                // 4. Denormalize provider & service details and determine price in paise
                String providerName = "Provider";
                String providerPhone = "";
                long amountInPaise = 0L;
                try {
                    var providerDoc = transaction.get(firestore.collection("providers").document(request.getProviderId())).get();
                    if (providerDoc.exists()) {
                        providerName = providerDoc.getString("name");
                        providerPhone = providerDoc.getString("phone");
                        ProviderDoc p = providerDoc.toObject(ProviderDoc.class);
                        if (p != null && p.getServices() != null) {
                            for (ProviderServiceItem item : p.getServices()) {
                                if (request.getServiceId().equalsIgnoreCase(item.getServiceId()) && item.getStartingPrice() != null) {
                                    amountInPaise = item.getStartingPrice();
                                    break;
                                }
                            }
                        }
                    }
                } catch (Exception ignored) {}

                if (request.getAmount() != null && request.getAmount() > 0) {
                    amountInPaise = Math.round(request.getAmount() * 100.0);
                }

                String serviceName = "Service";
                try {
                    var serviceDoc = transaction.get(firestore.collection("services").document(request.getServiceId())).get();
                    if (serviceDoc.exists()) {
                        serviceName = serviceDoc.getString("name");
                    }
                } catch (Exception ignored) {}

                // 5. Create new booking doc atomically
                DocumentReference newDocRef = firestore.collection("bookings").document();
                BookingDoc newBooking = BookingDoc.builder()
                        .id(newDocRef.getId())
                        .customerId(customerId)
                        .customerName(customerName)
                        .customerPhone(customerPhone)
                        .providerId(request.getProviderId())
                        .providerName(providerName)
                        .providerPhone(providerPhone)
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
                        .paymentMethod(request.getPaymentMethod())
                        .paymentStatus(PaymentStatus.PENDING.name())
                        .createdAt(new Date())
                        .build();

                transaction.set(newDocRef, newBooking);
                return mapToResponse(newBooking, customerEmail);
            }).get();
        } catch (ExecutionException e) {
            if (e.getCause() instanceof BookingConflictException bce) {
                throw bce;
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
                return mapToResponse(doc, null);
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
                    list.add(mapToResponse(b, null));
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

            BookingStatus currentStatus = BookingStatus.valueOf(doc.getStatus());
            if (currentStatus == BookingStatus.COMPLETED || currentStatus == BookingStatus.CANCELLED || currentStatus == BookingStatus.REJECTED) {
                throw new BadRequestException("Cannot cancel a booking with status: " + currentStatus);
            }

            doc.setStatus(BookingStatus.CANCELLED.name());
            doc.setCancelledBy(cancelledBy);
            doc.setCancellationReason(reason);
            docRef.set(doc).get();

            return mapToResponse(doc, null);
        } catch (ResourceNotFoundException | BadRequestException e) {
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

            doc.setStatus(targetStatus.name());
            if (targetStatus == BookingStatus.CANCELLED) {
                doc.setCancelledBy(providerId);
                doc.setCancellationReason(request.getCancellationReason());
            } else if (targetStatus == BookingStatus.COMPLETED) {
                doc.setPaymentStatus(PaymentStatus.PAID.name());
                // Increment completedJobs on provider
                incrementProviderCompletedJobs(providerId);
            }

            docRef.set(doc).get();
            return mapToResponse(doc, null);
        } catch (ResourceNotFoundException | UnauthorizedException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to update status for booking {}: {}", bookingId, e.getMessage());
            throw new RuntimeException("Error updating booking status: " + e.getMessage());
        }
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

    private void incrementProviderCompletedJobs(String providerId) {
        try {
            var provRef = firestore.collection("providers").document(providerId);
            firestore.runTransaction(tx -> {
                var snap = tx.get(provRef).get();
                if (snap.exists()) {
                    Long jobs = snap.getLong("completedJobs");
                    long updated = (jobs != null ? jobs : 0L) + 1L;
                    tx.update(provRef, "completedJobs", updated);
                }
                return null;
            }).get();
        } catch (Exception e) {
            log.warn("Failed to increment completed jobs for provider {}: {}", providerId, e.getMessage());
        }
    }

    public BookingResponse mapToResponse(BookingDoc doc, String customerEmail) {
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

        LocalDateTime createdLdt = null;
        if (doc.getCreatedAt() != null) {
            createdLdt = doc.getCreatedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        }

        return BookingResponse.builder()
                .id(doc.getId())
                .customerId(doc.getCustomerId())
                .customerName(doc.getCustomerName())
                .customerPhone(doc.getCustomerPhone())
                .customerEmail(customerEmail)
                .providerId(doc.getProviderId())
                .providerName(doc.getProviderName())
                .providerPhone(doc.getProviderPhone())
                .serviceId(doc.getServiceId())
                .serviceName(doc.getServiceName())
                .description(doc.getDescription())
                .latitude(doc.getLatitude())
                .longitude(doc.getLongitude())
                .address(doc.getAddress())
                .scheduledDate(sDate)
                .scheduledTime(sTime)
                .estimatedDurationMins(doc.getEstimatedDurationMins())
                .status(doc.getStatus() != null ? BookingStatus.valueOf(doc.getStatus()) : BookingStatus.REQUESTED)
                .cancelledBy(doc.getCancelledBy())
                .cancellationReason(doc.getCancellationReason())
                .amount(amountRupees)
                .paymentMethod(doc.getPaymentMethod())
                .paymentStatus(doc.getPaymentStatus() != null ? PaymentStatus.valueOf(doc.getPaymentStatus()) : PaymentStatus.PENDING)
                .createdAt(createdLdt)
                .build();
    }
}
