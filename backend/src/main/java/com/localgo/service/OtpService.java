package com.localgo.service;

import com.localgo.entity.OtpVerification;
import com.localgo.enums.OtpPurpose;
import com.localgo.exception.BadRequestException;
import com.localgo.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpVerificationRepository otpRepository;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void generateAndSendOtp(String email, OtpPurpose purpose) {
        String cleanEmail = email.trim().toLowerCase();

        // 1. Rate limiting: 30-second cooldown check
        otpRepository.findFirstByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(cleanEmail, purpose)
            .ifPresent(existingOtp -> {
                if (existingOtp.getCreatedAt() != null &&
                    existingOtp.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(30))) {
                    throw new BadRequestException("Please wait 30 seconds before requesting a new OTP code.");
                }
                // Invalidate existing active OTP
                existingOtp.setUsed(true);
                otpRepository.save(existingOtp);
            });

        // 2. Generate cryptographically secure 6-digit numeric OTP
        int rawCodeNumber = 100000 + secureRandom.nextInt(900000);
        String rawOtpCode = String.valueOf(rawCodeNumber);

        // 3. Hash OTP using SHA-256
        String hashedOtp = hashOtp(rawOtpCode);

        // 4. Save to database with 5-minute expiration
        OtpVerification otpEntity = OtpVerification.builder()
            .email(cleanEmail)
            .otpHash(hashedOtp)
            .purpose(purpose)
            .expiresAt(LocalDateTime.now().plusMinutes(5))
            .attempts(0)
            .used(false)
            .build();

        otpRepository.save(otpEntity);

        // 5. Send Email via EmailService
        emailService.sendOtpEmail(cleanEmail, rawOtpCode, purpose);
    }

    @Transactional
    public void verifyOtp(String email, String rawOtpCode, OtpPurpose purpose) {
        String cleanEmail = email.trim().toLowerCase();

        OtpVerification otpVerification = otpRepository
            .findFirstByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(cleanEmail, purpose)
            .orElseThrow(() -> new BadRequestException("No active OTP found. Please request a new verification code."));

        // Check max 5 attempts
        if (otpVerification.getAttempts() >= 5) {
            otpVerification.setUsed(true);
            otpRepository.save(otpVerification);
            throw new BadRequestException("Maximum OTP verification attempts exceeded (5). Please request a new code.");
        }

        // Check 5-minute expiry
        if (LocalDateTime.now().isAfter(otpVerification.getExpiresAt())) {
            otpVerification.setUsed(true);
            otpRepository.save(otpVerification);
            throw new BadRequestException("OTP verification code has expired. Please request a new code.");
        }

        // Verify SHA-256 hash
        String inputHash = hashOtp(rawOtpCode.trim());
        if (!inputHash.equalsIgnoreCase(otpVerification.getOtpHash())) {
            int newAttempts = otpVerification.getAttempts() + 1;
            otpVerification.setAttempts(newAttempts);
            if (newAttempts >= 5) {
                otpVerification.setUsed(true);
            }
            otpRepository.save(otpVerification);
            int remaining = 5 - newAttempts;
            if (remaining <= 0) {
                throw new BadRequestException("Maximum OTP verification attempts exceeded. Please request a new code.");
            }
            throw new BadRequestException("Invalid verification code. " + remaining + " attempt(s) remaining.");
        }

        // Successfully verified: mark as used
        otpVerification.setUsed(true);
        otpRepository.save(otpVerification);
    }

    public String hashOtp(String rawOtp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(rawOtp.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
