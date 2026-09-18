package com.localgo.controller;

import com.localgo.dto.request.ProviderProfileUpdateRequest;
import com.localgo.dto.request.StatusUpdateRequest;
import com.localgo.dto.response.ApiResponse;
import com.localgo.dto.response.BookingResponse;
import com.localgo.dto.response.ProviderDashboardResponse;
import com.localgo.enums.BookingStatus;
import com.localgo.service.ProviderDashboardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/provider")
@PreAuthorize("hasRole('PROVIDER')")
@RequiredArgsConstructor
public class ProviderPortalController {

    private final ProviderDashboardService providerDashboardService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<ProviderDashboardResponse>> getDashboardStats(Authentication authentication) {
        ProviderDashboardResponse response = providerDashboardService.getDashboardStats(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Provider dashboard stats fetched", response));
    }

    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getPendingRequests(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            Authentication authentication) {

        Page<BookingResponse> requests = providerDashboardService.getPendingRequests(
                authentication.getName(), PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ResponseEntity.ok(ApiResponse.success("Pending requests fetched", requests));
    }

    @PutMapping("/bookings/{id}/status")
    public ResponseEntity<ApiResponse<BookingResponse>> updateBookingStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            Authentication authentication) {

        BookingResponse response = providerDashboardService.updateBookingStatus(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Booking status updated to " + request.getStatus(), response));
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getProviderBookings(
            @RequestParam(value = "status", required = false) BookingStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            Authentication authentication) {

        Page<BookingResponse> bookings = providerDashboardService.getProviderBookings(
                authentication.getName(), status, PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ResponseEntity.ok(ApiResponse.success("Provider bookings fetched", bookings));
    }

    @GetMapping("/earnings")
    public ResponseEntity<ApiResponse<BigDecimal>> getEarnings(Authentication authentication) {
        BigDecimal earnings = providerDashboardService.getProviderEarnings(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Realized earnings fetched", earnings));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Void>> updateProfile(
            @Valid @RequestBody ProviderProfileUpdateRequest request,
            Authentication authentication) {

        providerDashboardService.updateProviderProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Provider profile updated successfully"));
    }

    @PutMapping("/availability")
    public ResponseEntity<ApiResponse<Boolean>> toggleAvailability(Authentication authentication) {
        boolean available = providerDashboardService.toggleAvailability(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Availability updated", available));
    }

    @GetMapping("/analytics/earnings-trend")
    public ResponseEntity<ApiResponse<List<com.localgo.dto.response.EarningsTrendResponse>>> getEarningsTrend(
            @RequestParam(value = "days", defaultValue = "7") int days,
            Authentication authentication) {

        List<com.localgo.dto.response.EarningsTrendResponse> trend = providerDashboardService.getProviderEarningsTrend(authentication.getName(), days);
        return ResponseEntity.ok(ApiResponse.success("Earnings trend fetched", trend));
    }
}

