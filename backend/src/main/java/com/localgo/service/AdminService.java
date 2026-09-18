package com.localgo.service;

import com.localgo.dto.request.ServiceCategoryCreateRequest;
import com.localgo.dto.response.*;
import com.localgo.entity.*;
import com.localgo.enums.BookingStatus;
import com.localgo.enums.Role;
import com.localgo.enums.VerificationStatus;
import com.localgo.exception.BadRequestException;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ServiceRepository serviceRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;

    private final AuthService authService;
    private final ProviderService providerService;
    private final BookingService bookingService;
    private final ServiceCategoryService serviceCategoryService;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboardStats() {
        long customers = userRepository.countByRole(Role.CUSTOMER);
        long providers = userRepository.countByRole(Role.PROVIDER);
        long pendingVerifications = providerProfileRepository.countByVerificationStatus(VerificationStatus.PENDING);
        long activeBookings = bookingRepository.countByStatus(BookingStatus.ACCEPTED)
                + bookingRepository.countByStatus(BookingStatus.ON_THE_WAY)
                + bookingRepository.countByStatus(BookingStatus.IN_PROGRESS);
        long completedBookings = bookingRepository.countByStatus(BookingStatus.COMPLETED);
        BigDecimal totalRevenue = bookingRepository.calculateTotalRealizedRevenue();

        return AdminDashboardResponse.builder()
                .totalCustomers(customers)
                .totalProviders(providers)
                .pendingVerifications(pendingVerifications)
                .activeBookings(activeBookings)
                .completedBookings(completedBookings)
                .totalRealizedRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllCustomers(Pageable pageable) {
        return userRepository.findByRole(Role.CUSTOMER, pageable)
                .map(authService::mapToUserResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProviderResponse> getAllProviders(VerificationStatus status, Pageable pageable) {
        if (status != null) {
            return providerProfileRepository.findByVerificationStatus(status, pageable)
                    .map(p -> providerService.mapToProviderResponse(p, null));
        }
        return providerProfileRepository.findAll(pageable)
                .map(p -> providerService.mapToProviderResponse(p, null));
    }

    @Transactional
    public ProviderResponse verifyProvider(Long providerId, VerificationStatus status) {
        ProviderProfile profile = providerProfileRepository.findById(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found with ID: " + providerId));

        profile.setVerificationStatus(status);
        providerProfileRepository.save(profile);
        return providerService.mapToProviderResponse(profile, null);
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> getAllBookings(BookingStatus status, Pageable pageable) {
        if (status != null) {
            return bookingRepository.findAll(pageable) // Filtered in service or memory if status provided
                    .map(bookingService::mapToBookingResponse);
        }
        return bookingRepository.findAll(pageable)
                .map(bookingService::mapToBookingResponse);
    }

    @Transactional
    public ServiceResponse createServiceCategory(ServiceCategoryCreateRequest request) {
        if (serviceRepository.existsByNameIgnoreCase(request.getName())) {
            throw new BadRequestException("A service category with this name already exists!");
        }

        ServiceEntity service = ServiceEntity.builder()
                .name(request.getName())
                .description(request.getDescription())
                .icon(request.getIcon())
                .category(request.getCategory())
                .defaultDurationMins(request.getDefaultDurationMins())
                .active(true)
                .build();

        serviceRepository.save(service);
        return serviceCategoryService.mapToResponse(service);
    }

    @Transactional
    public ServiceResponse updateServiceCategory(Long id, ServiceCategoryCreateRequest request) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service category not found"));

        service.setName(request.getName());
        service.setDescription(request.getDescription());
        service.setIcon(request.getIcon());
        service.setCategory(request.getCategory());
        service.setDefaultDurationMins(request.getDefaultDurationMins());

        serviceRepository.save(service);
        return serviceCategoryService.mapToResponse(service);
    }

    @Transactional
    public void deactivateServiceCategory(Long id) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service category not found"));
        service.setActive(false);
        serviceRepository.save(service);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getAllReviews(Pageable pageable) {
        return reviewRepository.findAll(pageable).map(r -> ReviewResponse.builder()
                .id(r.getId())
                .bookingId(r.getBooking().getId())
                .customerName(r.getCustomer().getName())
                .providerName(r.getProvider().getUser().getName())
                .rating(r.getRating())
                .comment(r.getComment())
                .hidden(r.getHidden())
                .createdAt(r.getCreatedAt())
                .build());
    }

    @Transactional
    public ReviewResponse toggleHideReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        review.setHidden(!review.getHidden());
        reviewRepository.save(review);

        // Recalculate provider average rating
        Double avgRating = reviewRepository.calculateAverageRatingForProvider(review.getProvider().getId());
        review.getProvider().setRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0);
        providerProfileRepository.save(review.getProvider());

        return ReviewResponse.builder()
                .id(review.getId())
                .bookingId(review.getBooking().getId())
                .customerName(review.getCustomer().getName())
                .providerName(review.getProvider().getUser().getName())
                .rating(review.getRating())
                .comment(review.getComment())
                .hidden(review.getHidden())
                .createdAt(review.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminTrendResponse> getAdminTrends(int days) {
        if (days <= 0 || days > 90) days = 7;
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        List<Object[]> revenueRows = bookingRepository.findAdminDailyRevenueTrend(startDate);
        List<Object[]> bookingRows = bookingRepository.findAdminDailyBookingCounts(startDate);
        List<Object[]> providerRows = providerProfileRepository.findDailyNewProviderCounts(startDate.atStartOfDay());

        java.util.Map<LocalDate, BigDecimal> revenueMap = new java.util.HashMap<>();
        java.util.Map<LocalDate, Integer> bookingMap = new java.util.HashMap<>();
        java.util.Map<LocalDate, Integer> providerMap = new java.util.HashMap<>();

        for (Object[] r : revenueRows) {
            if (r[0] != null) {
                LocalDate date = (r[0] instanceof java.sql.Date) ? ((java.sql.Date) r[0]).toLocalDate() : (LocalDate) r[0];
                revenueMap.put(date, (BigDecimal) r[1]);
            }
        }
        for (Object[] r : bookingRows) {
            if (r[0] != null) {
                LocalDate date = (r[0] instanceof java.sql.Date) ? ((java.sql.Date) r[0]).toLocalDate() : (LocalDate) r[0];
                bookingMap.put(date, ((Number) r[1]).intValue());
            }
        }
        for (Object[] r : providerRows) {
            if (r[0] != null) {
                LocalDate date;
                if (r[0] instanceof java.sql.Date) date = ((java.sql.Date) r[0]).toLocalDate();
                else if (r[0] instanceof java.sql.Timestamp) date = ((java.sql.Timestamp) r[0]).toLocalDateTime().toLocalDate();
                else date = LocalDate.parse(r[0].toString());
                providerMap.put(date, ((Number) r[1]).intValue());
            }
        }

        List<AdminTrendResponse> trend = new java.util.ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate current = startDate.plusDays(i);
            trend.add(AdminTrendResponse.builder()
                    .date(current)
                    .revenue(revenueMap.getOrDefault(current, BigDecimal.ZERO))
                    .bookingCount(bookingMap.getOrDefault(current, 0))
                    .newProvidersCount(providerMap.getOrDefault(current, 0))
                    .build());
        }
        return trend;
    }
}
