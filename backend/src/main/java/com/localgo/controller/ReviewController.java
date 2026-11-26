package com.localgo.controller;

import com.localgo.dto.request.ReviewRequest;
import com.localgo.dto.response.ApiResponse;
import com.localgo.dto.response.ReviewResponse;
import com.localgo.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/api/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {

        ReviewResponse review = reviewService.createReview(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Thank you for your review! ⭐", review));
    }

    @GetMapping("/api/providers/{providerId}/reviews")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProviderReviews(
            @PathVariable String providerId,
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "cursor", required = false) String cursor) {

        Map<String, Object> reviewsPage = reviewService.getProviderReviewsPaginated(providerId, limit, cursor);
        return ResponseEntity.ok(ApiResponse.success("Provider reviews fetched", reviewsPage));
    }
}
