package com.localgo.controller;

import com.localgo.dto.request.BookingRequest;
import com.localgo.dto.request.PaymentSelectionRequest;
import com.localgo.dto.response.ApiResponse;
import com.localgo.dto.response.BookingResponse;
import com.localgo.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody BookingRequest request,
            Authentication authentication) {

        BookingResponse response = bookingService.createBooking(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Booking request created successfully! 🎉", response));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getMyBookings(Authentication authentication) {
        List<BookingResponse> bookings = bookingService.getCustomerBookings(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Bookings fetched", bookings));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(
            @PathVariable String id,
            Authentication authentication) {

        BookingResponse booking = bookingService.getBookingById(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Booking details fetched", booking));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @PathVariable String id,
            @RequestParam(value = "reason", required = false) String reason,
            Authentication authentication) {

        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        BookingResponse booking = bookingService.cancelBooking(id, authentication.getName(), reason, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully", booking));
    }

    @PutMapping("/{id}/payment")
    public ResponseEntity<ApiResponse<BookingResponse>> submitPayment(
            @PathVariable String id,
            @Valid @RequestBody PaymentSelectionRequest request,
            Authentication authentication) {

        BookingResponse booking = bookingService.submitPaymentSelection(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Payment details submitted", booking));
    }
}
