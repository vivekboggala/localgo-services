package com.localgo.service;

import com.localgo.dto.request.*;
import com.localgo.dto.response.AuthResponse;
import com.localgo.dto.response.UserResponse;
import com.localgo.entity.ProviderProfile;
import com.localgo.entity.ProviderServiceEntity;
import com.localgo.entity.ServiceEntity;
import com.localgo.entity.User;
import com.localgo.enums.OtpPurpose;
import com.localgo.enums.Role;
import com.localgo.enums.VerificationStatus;
import com.localgo.exception.BadRequestException;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.repository.ProviderProfileRepository;
import com.localgo.repository.ProviderServiceRepository;
import com.localgo.repository.ServiceRepository;
import com.localgo.repository.UserRepository;
import com.localgo.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ServiceRepository serviceRepository;
    private final ProviderServiceRepository providerServiceRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final OtpService otpService;

    @Transactional
    public AuthResponse registerCustomer(RegisterRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new BadRequestException("Email is already registered!");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(cleanEmail)
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .emailVerified(false)
                .build();

        userRepository.save(user);

        // Generate and send Email Verification OTP
        otpService.generateAndSendOtp(cleanEmail, OtpPurpose.EMAIL_VERIFICATION);

        UserResponse userResponse = mapToUserResponse(user);
        return AuthResponse.builder().token(null).user(userResponse).build();
    }

    @Transactional
    public AuthResponse registerProvider(ProviderRegisterRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new BadRequestException("Email is already registered!");
        }

        ServiceEntity primaryService = serviceRepository.findById(request.getPrimaryServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Selected service category not found!"));

        User user = User.builder()
                .name(request.getName().trim())
                .email(cleanEmail)
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.PROVIDER)
                .emailVerified(false)
                .build();

        userRepository.save(user);

        ProviderProfile profile = ProviderProfile.builder()
                .user(user)
                .description(request.getDescription())
                .experienceYears(request.getExperienceYears())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .serviceArea(request.getServiceArea())
                .serviceRadiusKm(request.getServiceRadiusKm())
                .verificationStatus(VerificationStatus.PENDING)
                .available(true)
                .build();

        providerProfileRepository.save(profile);

        ProviderServiceEntity ps = ProviderServiceEntity.builder()
                .provider(profile)
                .service(primaryService)
                .startingPrice(BigDecimal.valueOf(request.getStartingPrice()))
                .active(true)
                .build();

        providerServiceRepository.save(ps);

        // Generate and send Email Verification OTP
        otpService.generateAndSendOtp(cleanEmail, OtpPurpose.EMAIL_VERIFICATION);

        UserResponse userResponse = mapToUserResponse(user);
        return AuthResponse.builder().token(null).user(userResponse).build();
    }

    public AuthResponse login(LoginRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(cleanEmail, request.getPassword())
        );

        if (Boolean.FALSE.equals(user.getEmailVerified())) {
            throw new BadRequestException("EMAIL_NOT_VERIFIED: Email is not verified. Please verify your email code.");
        }

        String token = tokenProvider.generateToken(authentication);
        UserResponse userResponse = mapToUserResponse(user);

        return AuthResponse.builder().token(token).user(userResponse).build();
    }

    @Transactional
    public AuthResponse verifyEmail(VerifyOtpRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        otpService.verifyOtp(cleanEmail, request.getOtp(), OtpPurpose.EMAIL_VERIFICATION);

        user.setEmailVerified(true);
        userRepository.save(user);

        String token = tokenProvider.generateTokenFromEmail(cleanEmail);
        UserResponse userResponse = mapToUserResponse(user);

        return AuthResponse.builder().token(token).user(userResponse).build();
    }

    public void resendOtp(ResendOtpRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(cleanEmail);
        if (userOpt.isPresent()) {
            otpService.generateAndSendOtp(cleanEmail, request.getPurpose());
        } else {
            log.info("Resend OTP requested for unknown email {}", cleanEmail);
        }
    }

    public String forgotPassword(ForgotPasswordRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(cleanEmail);
        if (userOpt.isPresent()) {
            otpService.generateAndSendOtp(cleanEmail, OtpPurpose.PASSWORD_RESET);
        } else {
            log.info("Forgot password requested for non-existent email {}", cleanEmail);
        }
        // Always return generic response for security/enumeration protection
        return "If an account exists for this email, a verification code has been sent.";
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new BadRequestException("Account not found."));

        otpService.verifyOtp(cleanEmail, request.getOtp(), OtpPurpose.PASSWORD_RESET);

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserResponse(user);
    }

    public UserResponse mapToUserResponse(User user) {
        Long providerId = null;
        if (user.getRole() == Role.PROVIDER) {
            providerId = providerProfileRepository.findByUserId(user.getId())
                    .map(ProviderProfile::getId)
                    .orElse(null);
        }

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .profileImage(user.getProfileImage())
                .providerProfileId(providerId)
                .emailVerified(user.getEmailVerified())
                .build();
    }
}
