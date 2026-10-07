package com.localgo.service;

import com.google.cloud.firestore.Firestore;
import com.localgo.dto.request.ReviewRequest;
import com.localgo.dto.response.ReviewResponse;
import com.localgo.exception.BadRequestException;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.exception.UnauthorizedException;
import com.localgo.model.BookingDoc;
import com.localgo.model.ReviewDoc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final Firestore firestore;

    public ReviewResponse createReview(ReviewRequest request, String customerId) {
        try {
            // 1. Validate booking exists and is COMPLETED
            var bookingSnap = firestore.collection("bookings").document(request.getBookingId()).get().get();
            if (!bookingSnap.exists()) {
                throw new ResourceNotFoundException("Booking not found: " + request.getBookingId());
            }
            BookingDoc booking = bookingSnap.toObject(BookingDoc.class);
            if (booking == null) {
                throw new ResourceNotFoundException("Booking not found: " + request.getBookingId());
            }

            if (!customerId.equals(booking.getCustomerId())) {
                throw new UnauthorizedException("You can only review your own bookings.");
            }

            if (!"COMPLETED".equalsIgnoreCase(booking.getStatus())) {
                throw new BadRequestException("Reviews can only be submitted for COMPLETED bookings.");
            }

            // 2. Validate one review per booking
            var existingReviews = firestore.collection("reviews")
                    .whereEqualTo("bookingId", request.getBookingId())
                    .get().get();
            if (!existingReviews.isEmpty()) {
                throw new BadRequestException("A review has already been submitted for this booking.");
            }

            // 3. Save review
            var newDocRef = firestore.collection("reviews").document();
            ReviewDoc review = ReviewDoc.builder()
                    .id(newDocRef.getId())
                    .bookingId(request.getBookingId())
                    .customerId(customerId)
                    .customerName(booking.getCustomerName())
                    .providerId(booking.getProviderId())
                    .rating(request.getRating().doubleValue())
                    .comment(request.getComment())
                    .createdAt(new Date())
                    .build();

            newDocRef.set(review).get();

            // 4. Live rating recalculation on provider doc
            recalculateProviderRating(booking.getProviderId());

            return mapToResponse(review, booking.getProviderName());
        } catch (ResourceNotFoundException | BadRequestException | UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to create review for booking {}: {}", request.getBookingId(), e.getMessage());
            throw new RuntimeException("Error submitting review: " + e.getMessage());
        }
    }

    public List<ReviewResponse> getProviderReviews(String providerId) {
        try {
            var snapshot = firestore.collection("reviews")
                    .whereEqualTo("providerId", providerId)
                    .get().get();

            List<ReviewResponse> list = new ArrayList<>();
            for (var doc : snapshot.getDocuments()) {
                ReviewDoc r = doc.toObject(ReviewDoc.class);
                if (r != null) {
                    r.setId(doc.getId());
                    list.add(mapToResponse(r, null));
                }
            }
            list.sort((a, b) -> {
                if (a.getCreatedAt() == null) return 1;
                if (b.getCreatedAt() == null) return -1;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });
            return list;
        } catch (Exception e) {
            log.error("Failed to get reviews for provider {}: {}", providerId, e.getMessage());
            throw new RuntimeException("Error fetching reviews: " + e.getMessage());
        }
    }

    private void recalculateProviderRating(String providerId) {
        try {
            var reviewsSnap = firestore.collection("reviews")
                    .whereEqualTo("providerId", providerId)
                    .get().get();

            if (!reviewsSnap.isEmpty()) {
                double sum = 0.0;
                for (var doc : reviewsSnap.getDocuments()) {
                    Double rating = doc.getDouble("rating");
                    if (rating != null) {
                        sum += rating;
                    }
                }
                double avg = BigDecimal.valueOf(sum / reviewsSnap.size())
                        .setScale(1, RoundingMode.HALF_UP)
                        .doubleValue();

                firestore.collection("providers").document(providerId).update("rating", avg).get();
                log.info("Recalculated provider {} rating: {} across {} reviews", providerId, avg, reviewsSnap.size());
            }
        } catch (Exception e) {
            log.warn("Failed to recalculate rating for provider {}: {}", providerId, e.getMessage());
        }
    }

    private ReviewResponse mapToResponse(ReviewDoc doc, String providerName) {
        LocalDateTime createdLdt = null;
        if (doc.getCreatedAt() != null) {
            createdLdt = doc.getCreatedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        }

        return ReviewResponse.builder()
                .id(doc.getId())
                .bookingId(doc.getBookingId())
                .customerName(doc.getCustomerName())
                .providerName(providerName)
                .rating(doc.getRating() != null ? doc.getRating().intValue() : 5)
                .comment(doc.getComment())
                .createdAt(createdLdt)
                .build();
    }
}
