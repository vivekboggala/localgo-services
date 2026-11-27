package com.localgo.service;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

            // 2 & 3. Atomically validate one review per booking using deterministic document ID
            var newDocRef = firestore.collection("reviews").document(request.getBookingId());
            ReviewDoc review = ReviewDoc.builder()
                    .id(request.getBookingId())
                    .bookingId(request.getBookingId())
                    .customerId(customerId)
                    .customerName(booking.getCustomerName())
                    .providerId(booking.getProviderId())
                    .rating(request.getRating().doubleValue())
                    .comment(request.getComment())
                    .createdAt(new Date())
                    .build();

            Boolean created = firestore.runTransaction(tx -> {
                var snap = tx.get(newDocRef).get();
                if (snap.exists()) {
                    return false;
                }
                tx.create(newDocRef, review);
                return true;
            }).get();

            if (!Boolean.TRUE.equals(created)) {
                throw new BadRequestException("A review has already been submitted for this booking.");
            }

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

    public Map<String, Object> getProviderReviewsPaginated(String providerId, int limit, String cursor) {
        int pageSize = Math.max(1, Math.min(limit, 100));
        try {
            var reviewsCol = firestore.collection("reviews");
            Query query = reviewsCol
                    .whereEqualTo("providerId", providerId)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .limit(pageSize + 1);

            if (cursor != null && !cursor.isBlank()) {
                DocumentSnapshot cursorSnap = reviewsCol.document(cursor.trim()).get().get();
                if (cursorSnap.exists()) {
                    query = query.startAfter(cursorSnap);
                }
            }

            var snapshot = query.get().get();
            List<ReviewResponse> page = new ArrayList<>();
            boolean hasMore = false;
            String nextCursor = null;

            for (var doc : snapshot.getDocuments()) {
                ReviewDoc r = doc.toObject(ReviewDoc.class);
                if (r == null || Boolean.TRUE.equals(r.getHidden())) {
                    continue;
                }
                r.setId(doc.getId());
                if (page.size() < pageSize) {
                    page.add(mapToResponse(r, null));
                    nextCursor = doc.getId();
                } else {
                    hasMore = true;
                    break;
                }
            }

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("content", page);
            res.put("limit", pageSize);
            res.put("nextCursor", hasMore ? nextCursor : null);
            res.put("hasMore", hasMore);
            return res;
        } catch (Exception e) {
            log.warn("Paged query fallback for provider {} reviews: {}", providerId, e.getMessage());
            List<ReviewResponse> all = getProviderReviews(providerId);
            int startIdx = 0;
            if (cursor != null && !cursor.isBlank()) {
                for (int i = 0; i < all.size(); i++) {
                    if (cursor.trim().equals(all.get(i).getId())) {
                        startIdx = i + 1;
                        break;
                    }
                }
            }
            int endIdx = Math.min(all.size(), startIdx + pageSize);
            List<ReviewResponse> slice = startIdx < endIdx ? all.subList(startIdx, endIdx) : List.of();
            boolean hasMore = endIdx < all.size();
            String nextCursor = hasMore && !slice.isEmpty() ? slice.get(slice.size() - 1).getId() : null;
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("content", slice);
            res.put("limit", pageSize);
            res.put("nextCursor", nextCursor);
            res.put("hasMore", hasMore);
            return res;
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
                if (r != null && !Boolean.TRUE.equals(r.getHidden())) {
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

    public void recalculateProviderRating(String providerId) {
        if (providerId == null || providerId.isBlank()) return;
        try {
            var reviewsSnap = firestore.collection("reviews")
                    .whereEqualTo("providerId", providerId)
                    .get().get();

            double sum = 0.0;
            int visibleCount = 0;
            if (reviewsSnap != null && !reviewsSnap.isEmpty()) {
                for (var doc : reviewsSnap.getDocuments()) {
                    if (Boolean.TRUE.equals(doc.getBoolean("hidden"))) {
                        continue;
                    }
                    Double rating = doc.getDouble("rating");
                    if (rating != null) {
                        sum += rating;
                        visibleCount++;
                    }
                }
            }
            double avg = visibleCount > 0
                    ? BigDecimal.valueOf(sum / visibleCount).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            firestore.collection("providers").document(providerId).update("rating", avg).get();
            log.info("Recalculated provider {} rating: {} across {} visible reviews", providerId, avg, visibleCount);
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
