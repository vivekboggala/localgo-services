package com.localgo.service;

import com.localgo.dto.request.BookingRequest;
import com.localgo.dto.response.BookingResponse;
import com.localgo.entity.*;
import com.localgo.enums.BookingStatus;
import com.localgo.enums.NotificationType;
import com.localgo.enums.PaymentStatus;
import com.localgo.exception.BadRequestException;
import com.localgo.exception.BookingConflictException;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.exception.UnauthorizedException;
import com.localgo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ServiceRepository serviceRepository;
    private final ProviderServiceRepository providerServiceRepository;
    private final NotificationService notificationService;

    @Transactional
    public BookingResponse createBooking(BookingRequest request, String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer account not found"));

        ProviderProfile provider = providerProfileRepository.findById(request.getProviderId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found"));

        ServiceEntity service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service category not found"));

        if (!provider.getAvailable()) {
            throw new BadRequestException("This service provider is currently marked unavailable.");
        }

        // Duration fallback: customer-specified -> service.defaultDurationMins -> 60
        int durationMins = request.getEstimatedDurationMins() != null ? request.getEstimatedDurationMins()
                : (service.getDefaultDurationMins() != null ? service.getDefaultDurationMins() : 60);

        // Conflict check
        long conflictCount = bookingRepository.countConflictingBookings(
                provider.getId(), request.getScheduledDate(), request.getScheduledTime(), durationMins
        );

        if (conflictCount > 0) {
            throw new BookingConflictException("This provider already has a booking during the selected time slot. Please choose a different time.");
        }

        // Calculate amount from provider service pricing
        BigDecimal amount = providerServiceRepository.findByProviderIdAndActiveTrue(provider.getId()).stream()
                .filter(ps -> ps.getService().getId().equals(service.getId()))
                .map(ProviderServiceEntity::getStartingPrice)
                .findFirst()
                .orElse(BigDecimal.valueOf(300));

        Booking booking = Booking.builder()
                .customer(customer)
                .provider(provider)
                .service(service)
                .description(request.getDescription())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(request.getAddress())
                .scheduledDate(request.getScheduledDate())
                .scheduledTime(request.getScheduledTime())
                .estimatedDurationMins(durationMins)
                .status(BookingStatus.REQUESTED)
                .amount(amount)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.PENDING)
                .build();

        bookingRepository.save(booking);

        // Send Notification to Provider
        notificationService.createNotification(
                provider.getUser().getId(),
                NotificationType.BOOKING_CREATED,
                "New Booking Request 📅",
                "Customer " + customer.getName() + " requested " + service.getName() + " for " + booking.getScheduledDate() + " at " + booking.getScheduledTime(),
                booking.getId()
        );

        return mapToBookingResponse(booking);
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> getCustomerBookings(String customerEmail, BookingStatus status, Pageable pageable) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        if (status != null) {
            return bookingRepository.findByCustomerIdAndStatus(customer.getId(), status, pageable).map(this::mapToBookingResponse);
        }
        return bookingRepository.findByCustomerId(customer.getId(), pageable).map(this::mapToBookingResponse);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id, String currentUserEmail) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Validate access
        boolean isCustomer = booking.getCustomer().getId().equals(currentUser.getId());
        boolean isProvider = booking.getProvider().getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == com.localgo.enums.Role.ADMIN;

        if (!isCustomer && !isProvider && !isAdmin) {
            throw new UnauthorizedException("You are not authorized to view this booking.");
        }

        return mapToBookingResponse(booking);
    }

    @Transactional
    public BookingResponse cancelBookingByCustomer(Long id, String reason, String customerEmail) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getCustomer().getEmail().equals(customerEmail)) {
            throw new UnauthorizedException("You can only cancel your own bookings.");
        }

        if (booking.getStatus() != BookingStatus.REQUESTED && booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new BadRequestException("Booking cannot be cancelled once service is on the way or in progress.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledBy("CUSTOMER");
        booking.setCancellationReason(reason != null ? reason : "Cancelled by customer");
        bookingRepository.save(booking);

        // Notify Provider
        notificationService.createNotification(
                booking.getProvider().getUser().getId(),
                NotificationType.BOOKING_CANCELLED,
                "Booking Cancelled ❌",
                "Booking #" + booking.getId() + " was cancelled by customer " + booking.getCustomer().getName(),
                booking.getId()
        );

        return mapToBookingResponse(booking);
    }

    public BookingResponse mapToBookingResponse(Booking b) {
        return BookingResponse.builder()
                .id(b.getId())
                .customerId(b.getCustomer().getId())
                .customerName(b.getCustomer().getName())
                .customerPhone(b.getCustomer().getPhone())
                .customerEmail(b.getCustomer().getEmail())
                .providerId(b.getProvider().getId())
                .providerUserId(b.getProvider().getUser().getId())
                .providerName(b.getProvider().getUser().getName())
                .providerPhone(b.getProvider().getUser().getPhone())
                .serviceId(b.getService().getId())
                .serviceName(b.getService().getName())
                .serviceCategory(b.getService().getCategory())
                .serviceIcon(b.getService().getIcon())
                .description(b.getDescription())
                .latitude(b.getLatitude())
                .longitude(b.getLongitude())
                .address(b.getAddress())
                .scheduledDate(b.getScheduledDate())
                .scheduledTime(b.getScheduledTime())
                .estimatedDurationMins(b.getEstimatedDurationMins())
                .status(b.getStatus())
                .cancelledBy(b.getCancelledBy())
                .cancellationReason(b.getCancellationReason())
                .amount(b.getAmount())
                .paymentMethod(b.getPaymentMethod())
                .paymentStatus(b.getPaymentStatus())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
