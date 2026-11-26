package com.localgo.controller;

import com.localgo.dto.request.ForgotPasswordRequest;
import com.localgo.dto.request.ProviderRegisterRequest;
import com.localgo.dto.request.RegisterRequest;
import com.localgo.dto.request.ResendOtpRequest;
import com.localgo.dto.request.ResetPasswordRequest;
import com.localgo.dto.request.VerifyOtpRequest;
import com.localgo.dto.response.ApiResponse;
import com.localgo.dto.response.AuthResponse;
import com.localgo.dto.response.UserResponse;
import com.localgo.service.AuthRateLimiterService;
import com.localgo.service.AuthRateLimiterService.LimitType;
import com.localgo.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthRateLimiterService authRateLimiterService;

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendOtp(
            @Valid @RequestBody ResendOtpRequest request,
            HttpServletRequest httpRequest) {
        authRateLimiterService.checkLimit(httpRequest, request.getEmail(), LimitType.OTP_SEND);
        authService.sendOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Verification code sent to your email."));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Void>> resendOtp(
            @Valid @RequestBody ResendOtpRequest request,
            HttpServletRequest httpRequest) {
        authRateLimiterService.checkLimit(httpRequest, request.getEmail(), LimitType.OTP_SEND);
        authService.sendOtp(request);
        return ResponseEntity.ok(ApiResponse.success("A new verification code has been sent to your email."));
    }

    @PostMapping({"/verify-email", "/verify-otp"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyEmail(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletRequest httpRequest) {
        authRateLimiterService.checkLimit(httpRequest, request.getEmail(), LimitType.OTP_VERIFY);
        Map<String, Object> result = authService.verifyEmailOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully", result));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCustomer(
            @Valid @RequestBody RegisterRequest request,
            Authentication authentication) {
        String uid = authentication != null ? authentication.getName() : null;
        AuthResponse response = authService.registerCustomerWithOtp(request, uid);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/register/provider")
    public ResponseEntity<ApiResponse<AuthResponse>> registerProvider(
            @Valid @RequestBody ProviderRegisterRequest request,
            Authentication authentication) {
        String uid = authentication != null ? authentication.getName() : null;
        AuthResponse response = authService.registerProviderWithOtp(request, uid);
        return ResponseEntity.ok(ApiResponse.success("Provider registration successful", response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        authRateLimiterService.checkLimit(httpRequest, request.getEmail(), LimitType.OTP_SEND);
        String message = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyResetOtp(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletRequest httpRequest) {
        authRateLimiterService.checkLimit(httpRequest, request.getEmail(), LimitType.OTP_VERIFY);
        Map<String, Object> result = authService.verifyPasswordResetOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully", result));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully. You may now log in with your new password."));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        UserResponse response = authService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Profile fetched", response));
    }
}
