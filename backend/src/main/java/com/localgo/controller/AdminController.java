package com.localgo.controller;

import com.localgo.dto.response.ApiResponse;
import com.localgo.dto.response.ProviderResponse;
import com.localgo.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success("Admin dashboard fetched", adminService.getDashboardOverview()));
    }

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProviders(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "search", required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success("Providers fetched", adminService.getProviders(status, search)));
    }

    @PutMapping("/providers/{id}/verify")
    public ResponseEntity<ApiResponse<ProviderResponse>> verifyProvider(
            @PathVariable String id,
            @RequestParam(value = "status", required = false) String queryStatus,
            @RequestParam(value = "reason", required = false) String queryReason,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String status = (body != null && body.get("status") != null) ? body.get("status") : queryStatus;
        String reason = (body != null && body.get("reason") != null) ? body.get("reason") : queryReason;
        String adminUid = authentication != null ? authentication.getName() : "admin";
        ProviderResponse updated = adminService.verifyProvider(id, status, reason, adminUid);
        return ResponseEntity.ok(ApiResponse.success("Provider verification updated to " + updated.getVerificationStatus(), updated));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUsers() {
        return ResponseEntity.ok(ApiResponse.success("Users fetched", adminService.getUsers()));
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBookings(
            @RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success("Bookings fetched", adminService.getBookings(status)));
    }

    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReviews() {
        return ResponseEntity.ok(ApiResponse.success("Reviews fetched", adminService.getReviews()));
    }

    @PutMapping("/reviews/{id}/hide")
    public ResponseEntity<ApiResponse<Boolean>> toggleHideReview(@PathVariable String id) {
        boolean hidden = adminService.toggleHideReview(id);
        return ResponseEntity.ok(ApiResponse.success("Review visibility updated", hidden));
    }

    @GetMapping("/analytics/trends")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTrends(
            @RequestParam(value = "days", defaultValue = "7") int days) {
        return ResponseEntity.ok(ApiResponse.success("Admin analytics fetched", adminService.getAnalyticsTrends(days)));
    }
}
