package com.localgo.controller;

import com.localgo.dto.request.ServiceCategoryCreateRequest;
import com.localgo.dto.response.*;
import com.localgo.enums.BookingStatus;
import com.localgo.enums.VerificationStatus;
import com.localgo.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getDashboardStats() {
        AdminDashboardResponse stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Admin dashboard stats fetched", stats));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllCustomers(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        Page<UserResponse> users = adminService.getAllCustomers(PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.success("Customers list fetched", users));
    }

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<Page<ProviderResponse>>> getAllProviders(
            @RequestParam(value = "status", required = false) VerificationStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        Page<ProviderResponse> providers = adminService.getAllProviders(status, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.success("Providers list fetched", providers));
    }

    @PutMapping("/providers/{id}/verify")
    public ResponseEntity<ApiResponse<ProviderResponse>> verifyProvider(
            @PathVariable Long id,
            @RequestParam("status") VerificationStatus status) {

        ProviderResponse provider = adminService.verifyProvider(id, status);
        return ResponseEntity.ok(ApiResponse.success("Provider status set to " + status, provider));
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getAllBookings(
            @RequestParam(value = "status", required = false) BookingStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        Page<BookingResponse> bookings = adminService.getAllBookings(status, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.success("Bookings list fetched", bookings));
    }

    @PostMapping("/services")
    public ResponseEntity<ApiResponse<ServiceResponse>> createServiceCategory(
            @Valid @RequestBody ServiceCategoryCreateRequest request) {

        ServiceResponse service = adminService.createServiceCategory(request);
        return ResponseEntity.ok(ApiResponse.success("Service category created", service));
    }

    @PutMapping("/services/{id}")
    public ResponseEntity<ApiResponse<ServiceResponse>> updateServiceCategory(
            @PathVariable Long id,
            @Valid @RequestBody ServiceCategoryCreateRequest request) {

        ServiceResponse service = adminService.updateServiceCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Service category updated", service));
    }

    @DeleteMapping("/services/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivateServiceCategory(@PathVariable Long id) {
        adminService.deactivateServiceCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Service category deactivated"));
    }

    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getAllReviews(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        Page<ReviewResponse> reviews = adminService.getAllReviews(PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.success("Reviews list fetched", reviews));
    }

    @PutMapping("/reviews/{id}/hide")
    public ResponseEntity<ApiResponse<ReviewResponse>> toggleHideReview(@PathVariable Long id) {
        ReviewResponse review = adminService.toggleHideReview(id);
        return ResponseEntity.ok(ApiResponse.success("Review visibility toggled", review));
    }

    @GetMapping("/analytics/trends")
    public ResponseEntity<ApiResponse<java.util.List<AdminTrendResponse>>> getAdminTrends(
            @RequestParam(value = "days", defaultValue = "7") int days) {
        java.util.List<AdminTrendResponse> trends = adminService.getAdminTrends(days);
        return ResponseEntity.ok(ApiResponse.success("Admin trends fetched", trends));
    }
}

