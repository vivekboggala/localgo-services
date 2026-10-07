package com.localgo.controller;

import com.localgo.dto.request.ProviderProfileUpdateRequest;
import com.localgo.dto.request.StatusUpdateRequest;
import com.localgo.dto.response.ApiResponse;
import com.localgo.dto.response.BookingResponse;
import com.localgo.dto.response.EarningsTrendResponse;
import com.localgo.dto.response.ProviderDashboardResponse;
import com.localgo.dto.response.ProviderResponse;
import com.localgo.enums.BookingStatus;
import com.localgo.service.ProviderDashboardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getPendingRequests(Authentication authentication) {
        List<BookingResponse> requests = providerDashboardService.getPendingRequests(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Pending requests fetched", requests));
    }

    @PutMapping("/bookings/{id}/status")
    public ResponseEntity<ApiResponse<BookingResponse>> updateBookingStatus(
            @PathVariable String id,
            @Valid @RequestBody StatusUpdateRequest request,
            Authentication authentication) {

        BookingResponse response = providerDashboardService.updateBookingStatus(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Booking status updated to " + request.getStatus(), response));
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getProviderBookings(
            @RequestParam(value = "status", required = false) BookingStatus status,
            Authentication authentication) {

        List<BookingResponse> bookings = providerDashboardService.getProviderBookings(authentication.getName(), status);
        return ResponseEntity.ok(ApiResponse.success("Provider bookings fetched", bookings));
    }

    @GetMapping("/earnings")
    public ResponseEntity<ApiResponse<BigDecimal>> getEarnings(Authentication authentication) {
        BigDecimal earnings = providerDashboardService.getProviderEarnings(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Realized earnings fetched", earnings));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<ProviderResponse>> getProfile(Authentication authentication) {
        ProviderResponse response = providerDashboardService.getProviderProfile(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Provider profile fetched", response));
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
    public ResponseEntity<ApiResponse<List<EarningsTrendResponse>>> getEarningsTrend(
            @RequestParam(value = "days", defaultValue = "7") int days,
            Authentication authentication) {

        List<EarningsTrendResponse> trend = providerDashboardService.getProviderEarningsTrend(authentication.getName(), days);
        return ResponseEntity.ok(ApiResponse.success("Earnings trend fetched", trend));
    }
}
