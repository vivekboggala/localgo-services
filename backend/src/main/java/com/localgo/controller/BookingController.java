package com.localgo.controller;

import com.localgo.dto.request.BookingRequest;
import com.localgo.dto.response.ApiResponse;
import com.localgo.dto.response.BookingResponse;
import com.localgo.enums.BookingStatus;
import com.localgo.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getMyBookings(
            @RequestParam(value = "status", required = false) BookingStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            Authentication authentication) {

        Page<BookingResponse> bookings = bookingService.getCustomerBookings(
                authentication.getName(), status, PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ResponseEntity.ok(ApiResponse.success("Bookings fetched", bookings));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(
            @PathVariable Long id,
            Authentication authentication) {

        BookingResponse booking = bookingService.getBookingById(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Booking details fetched", booking));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @PathVariable Long id,
            @RequestParam(value = "reason", required = false) String reason,
            Authentication authentication) {

        BookingResponse booking = bookingService.cancelBookingByCustomer(id, reason, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully", booking));
    }
}
