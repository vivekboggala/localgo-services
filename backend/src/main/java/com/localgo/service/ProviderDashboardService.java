package com.localgo.service;

import com.localgo.dto.request.ProviderProfileUpdateRequest;
import com.localgo.dto.request.StatusUpdateRequest;
import com.localgo.dto.response.BookingResponse;
import com.localgo.dto.response.ProviderDashboardResponse;
import com.localgo.entity.Booking;
import com.localgo.entity.ProviderProfile;
import com.localgo.enums.BookingStatus;
import com.localgo.enums.NotificationType;
import com.localgo.enums.PaymentStatus;
import com.localgo.exception.BadRequestException;
import com.localgo.exception.BookingConflictException;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.repository.BookingRepository;
import com.localgo.repository.ProviderProfileRepository;
import com.localgo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProviderDashboardService {

    private final ProviderProfileRepository providerProfileRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final BookingService bookingService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public ProviderDashboardResponse getDashboardStats(String providerEmail) {
        ProviderProfile profile = getProfileByEmail(providerEmail);

        List<Booking> pendingRequests = bookingRepository.findByProviderIdAndStatus(
                profile.getId(), BookingStatus.REQUESTED, Pageable.unpaged()
        ).getContent();

        List<Booking> activeJobs = bookingRepository.findByProviderId(profile.getId(), Pageable.unpaged())
                .getContent().stream()
                .filter(b -> b.getStatus() == BookingStatus.ACCEPTED || b.getStatus() == BookingStatus.ON_THE_WAY || b.getStatus() == BookingStatus.IN_PROGRESS)
                .collect(Collectors.toList());

        BigDecimal totalEarnings = bookingRepository.calculateProviderRealizedEarnings(profile.getId());

        List<BookingResponse> pendingResponses = pendingRequests.stream()
                .map(bookingService::mapToBookingResponse)
                .collect(Collectors.toList());

        List<BookingResponse> activeResponses = activeJobs.stream()
                .map(bookingService::mapToBookingResponse)
                .collect(Collectors.toList());

        return ProviderDashboardResponse.builder()
                .providerId(profile.getId())
                .providerName(profile.getUser().getName())
                .verificationStatus(profile.getVerificationStatus())
                .available(profile.getAvailable())
                .rating(profile.getRating())
                .completedJobs(profile.getCompletedJobs())
                .serviceRadiusKm(profile.getServiceRadiusKm())
                .todayRequestsCount(pendingRequests.stream().filter(b -> b.getScheduledDate().equals(LocalDate.now())).count())
                .activeJobsCount(activeJobs.size())
                .totalCompletedJobs(profile.getCompletedJobs())
                .totalRealizedEarnings(totalEarnings != null ? totalEarnings : BigDecimal.ZERO)
                .pendingRequests(pendingResponses)
                .activeJobs(activeResponses)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> getPendingRequests(String providerEmail, Pageable pageable) {
        ProviderProfile profile = getProfileByEmail(providerEmail);
        return bookingRepository.findByProviderIdAndStatus(profile.getId(), BookingStatus.REQUESTED, pageable)
                .map(bookingService::mapToBookingResponse);
    }

    @Transactional
    public BookingResponse updateBookingStatus(Long bookingId, StatusUpdateRequest request, String providerEmail) {
        ProviderProfile profile = getProfileByEmail(providerEmail);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        if (!booking.getProvider().getId().equals(profile.getId())) {
            throw new BadRequestException("You are not authorized to update this booking.");
        }

        BookingStatus newStatus = request.getStatus();
        BookingStatus currentStatus = booking.getStatus();

        // Rules enforcement
        if (newStatus == BookingStatus.ACCEPTED) {
            if (currentStatus != BookingStatus.REQUESTED) {
                throw new BadRequestException("Only REQUESTED bookings can be accepted.");
            }
            // Conflict check
            long conflicts = bookingRepository.countConflictingBookings(
                    profile.getId(), booking.getScheduledDate(), booking.getScheduledTime(), booking.getEstimatedDurationMins()
            );
            if (conflicts > 0) {
                throw new BookingConflictException("You already have an active booking overlapping with this time slot!");
            }
            booking.setStatus(BookingStatus.ACCEPTED);
            notificationService.createNotification(
                    booking.getCustomer().getId(),
                    NotificationType.BOOKING_ACCEPTED,
                    "Booking Accepted! ✅",
                    "Provider " + profile.getUser().getName() + " accepted your booking #" + booking.getId(),
                    booking.getId()
            );
        } else if (newStatus == BookingStatus.REJECTED) {
            if (currentStatus != BookingStatus.REQUESTED) {
                throw new BadRequestException("Only REQUESTED bookings can be rejected.");
            }
            booking.setStatus(BookingStatus.REJECTED);
            notificationService.createNotification(
                    booking.getCustomer().getId(),
                    NotificationType.BOOKING_REJECTED,
                    "Booking Rejected ❌",
                    "Provider " + profile.getUser().getName() + " rejected booking #" + booking.getId(),
                    booking.getId()
            );
        } else if (newStatus == BookingStatus.ON_THE_WAY) {
            if (currentStatus != BookingStatus.ACCEPTED) {
                throw new BadRequestException("Booking must be ACCEPTED before marking ON_THE_WAY.");
            }
            booking.setStatus(BookingStatus.ON_THE_WAY);
            notificationService.createNotification(
                    booking.getCustomer().getId(),
                    NotificationType.PROVIDER_ON_THE_WAY,
                    "Provider On The Way! 🚗",
                    profile.getUser().getName() + " is traveling to your doorstep.",
                    booking.getId()
            );
        } else if (newStatus == BookingStatus.IN_PROGRESS) {
            if (currentStatus != BookingStatus.ON_THE_WAY) {
                throw new BadRequestException("Booking must be ON_THE_WAY before marking IN_PROGRESS.");
            }
            booking.setStatus(BookingStatus.IN_PROGRESS);
            notificationService.createNotification(
                    booking.getCustomer().getId(),
                    NotificationType.SERVICE_STARTED,
                    "Service Started 🛠️",
                    profile.getUser().getName() + " has started working on your service.",
                    booking.getId()
            );
        } else if (newStatus == BookingStatus.COMPLETED) {
            if (currentStatus != BookingStatus.IN_PROGRESS) {
                throw new BadRequestException("Booking must be IN_PROGRESS before marking COMPLETED.");
            }
            booking.setStatus(BookingStatus.COMPLETED);
            booking.setPaymentStatus(PaymentStatus.PAID);
            profile.setCompletedJobs(profile.getCompletedJobs() + 1);
            providerProfileRepository.save(profile);

            notificationService.createNotification(
                    booking.getCustomer().getId(),
                    NotificationType.SERVICE_COMPLETED,
                    "Service Completed! 🎉",
                    "Service #" + booking.getId() + " completed. Please rate your experience!",
                    booking.getId()
            );
        } else if (newStatus == BookingStatus.CANCELLED) {
            if (currentStatus == BookingStatus.IN_PROGRESS || currentStatus == BookingStatus.COMPLETED) {
                throw new BadRequestException("Booking cannot be cancelled once service is IN_PROGRESS or COMPLETED.");
            }
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setCancelledBy("PROVIDER");
            booking.setCancellationReason(request.getCancellationReason() != null ? request.getCancellationReason() : "Cancelled by provider");

            notificationService.createNotification(
                    booking.getCustomer().getId(),
                    NotificationType.BOOKING_CANCELLED,
                    "Booking Cancelled by Provider ⚠️",
                    "Provider " + profile.getUser().getName() + " cancelled booking #" + booking.getId() + ". Reason: " + booking.getCancellationReason(),
                    booking.getId()
            );
        }

        bookingRepository.save(booking);
        return bookingService.mapToBookingResponse(booking);
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> getProviderBookings(String providerEmail, BookingStatus status, Pageable pageable) {
        ProviderProfile profile = getProfileByEmail(providerEmail);
        if (status != null) {
            return bookingRepository.findByProviderIdAndStatus(profile.getId(), status, pageable).map(bookingService::mapToBookingResponse);
        }
        return bookingRepository.findByProviderId(profile.getId(), pageable).map(bookingService::mapToBookingResponse);
    }

    @Transactional(readOnly = true)
    public BigDecimal getProviderEarnings(String providerEmail) {
        ProviderProfile profile = getProfileByEmail(providerEmail);
        BigDecimal earnings = bookingRepository.calculateProviderRealizedEarnings(profile.getId());
        return earnings != null ? earnings : BigDecimal.ZERO;
    }

    @Transactional
    public ProviderProfile updateProviderProfile(String providerEmail, ProviderProfileUpdateRequest request) {
        ProviderProfile profile = getProfileByEmail(providerEmail);
        profile.setDescription(request.getDescription());
        profile.setExperienceYears(request.getExperienceYears());
        profile.setServiceArea(request.getServiceArea());
        profile.setServiceRadiusKm(request.getServiceRadiusKm());
        if (request.getAvailable() != null) profile.setAvailable(request.getAvailable());
        if (request.getLatitude() != null) profile.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) profile.setLongitude(request.getLongitude());
        return providerProfileRepository.save(profile);
    }

    @Transactional
    public boolean toggleAvailability(String providerEmail) {
        ProviderProfile profile = getProfileByEmail(providerEmail);
        profile.setAvailable(!profile.getAvailable());
        providerProfileRepository.save(profile);
        return profile.getAvailable();
    }

    @Transactional(readOnly = true)
    public List<com.localgo.dto.response.EarningsTrendResponse> getProviderEarningsTrend(String providerEmail, int days) {
        if (days <= 0 || days > 90) days = 7;
        ProviderProfile profile = getProfileByEmail(providerEmail);
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        List<Object[]> rows = bookingRepository.findProviderDailyEarningsTrend(profile.getId(), startDate);
        java.util.Map<LocalDate, Object[]> dataMap = new java.util.HashMap<>();
        for (Object[] r : rows) {
            if (r[0] != null) {
                LocalDate date = (r[0] instanceof java.sql.Date) ? ((java.sql.Date) r[0]).toLocalDate() : (LocalDate) r[0];
                dataMap.put(date, r);
            }
        }

        List<com.localgo.dto.response.EarningsTrendResponse> trend = new java.util.ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate current = startDate.plusDays(i);
            Object[] r = dataMap.get(current);
            BigDecimal earnings = (r != null && r[1] != null) ? (BigDecimal) r[1] : BigDecimal.ZERO;
            int count = (r != null && r[2] != null) ? ((Number) r[2]).intValue() : 0;

            trend.add(com.localgo.dto.response.EarningsTrendResponse.builder()
                    .date(current)
                    .earnings(earnings)
                    .completedBookings(count)
                    .build());
        }
        return trend;
    }

    private ProviderProfile getProfileByEmail(String email) {
        Long userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found")).getId();

        return providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));
    }
}
