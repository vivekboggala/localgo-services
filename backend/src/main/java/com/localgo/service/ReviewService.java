package com.localgo.service;

import com.localgo.dto.request.ReviewRequest;
import com.localgo.dto.response.ReviewResponse;
import com.localgo.entity.Booking;
import com.localgo.entity.ProviderProfile;
import com.localgo.entity.Review;
import com.localgo.entity.User;
import com.localgo.enums.BookingStatus;
import com.localgo.enums.NotificationType;
import com.localgo.exception.BadRequestException;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.exception.UnauthorizedException;
import com.localgo.repository.BookingRepository;
import com.localgo.repository.ProviderProfileRepository;
import com.localgo.repository.ReviewRepository;
import com.localgo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final NotificationService notificationService;

    @Transactional
    public ReviewResponse createReview(ReviewRequest request, String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + request.getBookingId()));

        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new UnauthorizedException("You can only review your own completed bookings.");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException("You can only submit a review after the service has been COMPLETED.");
        }

        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new BadRequestException("You have already submitted a review for this booking.");
        }

        ProviderProfile provider = booking.getProvider();

        Review review = Review.builder()
                .booking(booking)
                .customer(customer)
                .provider(provider)
                .rating(request.getRating())
                .comment(request.getComment())
                .hidden(false)
                .build();

        reviewRepository.save(review);

        // Recalculate Provider Rating
        Double avgRating = reviewRepository.calculateAverageRatingForProvider(provider.getId());
        if (avgRating != null) {
            provider.setRating(Math.round(avgRating * 10.0) / 10.0);
            providerProfileRepository.save(provider);
        }

        // Notify Provider
        notificationService.createNotification(
                provider.getUser().getId(),
                NotificationType.NEW_REVIEW,
                "New Customer Review ⭐",
                "Customer " + customer.getName() + " left a " + request.getRating() + "-star review!",
                booking.getId()
        );

        return mapToResponse(review);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getProviderReviews(Long providerId, Pageable pageable) {
        return reviewRepository.findByProviderIdAndHiddenFalse(providerId, pageable)
                .map(this::mapToResponse);
    }

    public ReviewResponse mapToResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .bookingId(r.getBooking().getId())
                .customerName(r.getCustomer().getName())
                .providerName(r.getProvider().getUser().getName())
                .rating(r.getRating())
                .comment(r.getComment())
                .hidden(r.getHidden())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
