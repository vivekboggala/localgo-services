package com.localgo.controller;

import com.localgo.dto.request.ReviewRequest;
import com.localgo.dto.response.ApiResponse;
import com.localgo.dto.response.ReviewResponse;
import com.localgo.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getProviderReviews(
            @PathVariable Long providerId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        Page<ReviewResponse> reviews = reviewService.getProviderReviews(
                providerId, PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ResponseEntity.ok(ApiResponse.success("Provider reviews fetched", reviews));
    }
}
