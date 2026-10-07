package com.localgo.controller;

import com.localgo.dto.request.ProviderRegisterRequest;
import com.localgo.dto.request.RegisterRequest;
import com.localgo.dto.response.ApiResponse;
import com.localgo.dto.response.AuthResponse;
import com.localgo.dto.response.UserResponse;
import com.localgo.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCustomer(
            @Valid @RequestBody RegisterRequest request,
            Authentication authentication) {
        String uid = authentication != null ? authentication.getName() : null;
        AuthResponse response = authService.registerCustomer(request, uid);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/register/provider")
    public ResponseEntity<ApiResponse<AuthResponse>> registerProvider(
            @Valid @RequestBody ProviderRegisterRequest request,
            Authentication authentication) {
        String uid = authentication != null ? authentication.getName() : null;
        AuthResponse response = authService.registerProvider(request, uid);
        return ResponseEntity.ok(ApiResponse.success("Provider registration successful", response));
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
