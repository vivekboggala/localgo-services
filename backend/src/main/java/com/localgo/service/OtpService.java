package com.localgo.service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.localgo.enums.OtpPurpose;
import com.localgo.exception.BadRequestException;
import com.localgo.model.OtpDoc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private static final String OTP_COLLECTION = "otp_verifications";
    private static final long RESEND_COOLDOWN_MS = 30_000L;
    private static final long OTP_TTL_MS = 5 * 60_000L;
    private static final long VERIFIED_TOKEN_TTL_MS = 15 * 60_000L;
    private static final int MAX_ATTEMPTS = 5;

    private final Firestore firestore;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public void generateAndSendOtp(String email, OtpPurpose purpose) {
        String cleanEmail = normalizeEmail(email);
        DocumentReference docRef = getDocRef(cleanEmail, purpose);

        try {
            DocumentSnapshot snap = docRef.get().get();
            if (snap.exists()) {
                OtpDoc existing = snap.toObject(OtpDoc.class);
                if (existing != null
                        && !existing.isUsed()
                        && !existing.isVerified()
                        && existing.getCreatedAt() != null
                        && System.currentTimeMillis() - existing.getCreatedAt().getTime() < RESEND_COOLDOWN_MS) {
                    throw new BadRequestException("Please wait 30 seconds before requesting a new OTP code.");
                }
            }

            int rawCodeNumber = 100000 + secureRandom.nextInt(900000);
            String rawOtpCode = String.valueOf(rawCodeNumber);
            String hashedOtp = hashOtp(rawOtpCode);
            Date now = new Date();

            OtpDoc otpDoc = OtpDoc.builder()
                    .id(docRef.getId())
                    .email(cleanEmail)
                    .otpHash(hashedOtp)
                    .purpose(purpose.name())
                    .expiresAt(new Date(now.getTime() + OTP_TTL_MS))
                    .attempts(0)
                    .used(false)
                    .verified(false)
                    .verificationToken(null)
                    .verifiedAt(null)
                    .createdAt(now)
                    .build();

            // Send email first so failed SMTP delivery does not leave an unsendable cooldown doc
            emailService.sendOtpEmail(cleanEmail, rawOtpCode, purpose);
            docRef.set(otpDoc).get();
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to generate OTP for {}: {}", cleanEmail, e.getMessage());
            throw new RuntimeException("Unable to process OTP request: " + e.getMessage());
        }
    }

    public String verifyOtp(String email, String rawOtpCode, OtpPurpose purpose) {
        String cleanEmail = normalizeEmail(email);
        DocumentReference docRef = getDocRef(cleanEmail, purpose);

        try {
            DocumentSnapshot snap = docRef.get().get();
            if (!snap.exists()) {
                throw new BadRequestException("No active OTP found. Please request a new verification code.");
            }

            OtpDoc otpDoc = snap.toObject(OtpDoc.class);
            if (otpDoc == null || otpDoc.isUsed() || otpDoc.isVerified()) {
                throw new BadRequestException("No active OTP found. Please request a new verification code.");
            }

            if (otpDoc.getAttempts() >= MAX_ATTEMPTS) {
                otpDoc.setUsed(true);
                docRef.set(otpDoc).get();
                throw new BadRequestException("Maximum OTP verification attempts exceeded (5). Please request a new code.");
            }

            if (otpDoc.getExpiresAt() == null || new Date().after(otpDoc.getExpiresAt())) {
                otpDoc.setUsed(true);
                docRef.set(otpDoc).get();
                throw new BadRequestException("OTP verification code has expired. Please request a new code.");
            }

            String inputHash = hashOtp(rawOtpCode.trim());
            if (!inputHash.equalsIgnoreCase(otpDoc.getOtpHash())) {
                int newAttempts = otpDoc.getAttempts() + 1;
                otpDoc.setAttempts(newAttempts);
                if (newAttempts >= MAX_ATTEMPTS) {
                    otpDoc.setUsed(true);
                }
                docRef.set(otpDoc).get();

                int remaining = MAX_ATTEMPTS - newAttempts;
                if (remaining <= 0) {
                    throw new BadRequestException("Maximum OTP verification attempts exceeded. Please request a new code.");
                }
                throw new BadRequestException("Invalid verification code. " + remaining + " attempt(s) remaining.");
            }

            String verificationToken = UUID.randomUUID().toString();
            otpDoc.setVerified(true);
            otpDoc.setVerifiedAt(new Date());
            otpDoc.setVerificationToken(verificationToken);
            docRef.set(otpDoc).get();
            return verificationToken;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify OTP for {}: {}", cleanEmail, e.getMessage());
            throw new RuntimeException("Unable to verify OTP: " + e.getMessage());
        }
    }

    public void validateVerifiedRegistrationToken(String email, String verificationToken) {
        validateVerifiedToken(email, OtpPurpose.EMAIL_VERIFICATION, verificationToken, false,
                "Email verification is required before creating an account.");
    }

    public void validateAndConsumeResetToken(String email, String verificationToken) {
        validateVerifiedToken(email, OtpPurpose.PASSWORD_RESET, verificationToken, true,
                "OTP verification is required before resetting your password.");
    }

    public void consumeResetOtp(String email) {
        markTokenUsed(email, OtpPurpose.PASSWORD_RESET);
    }

    private void validateVerifiedToken(String email, OtpPurpose purpose, String verificationToken,
                                       boolean consumeOnSuccess, String missingMessage) {
        if (verificationToken == null || verificationToken.isBlank()) {
            throw new BadRequestException(missingMessage);
        }

        String cleanEmail = normalizeEmail(email);
        DocumentReference docRef = getDocRef(cleanEmail, purpose);

        try {
            DocumentSnapshot snap = docRef.get().get();
            if (!snap.exists()) {
                throw new BadRequestException(missingMessage);
            }

            OtpDoc otpDoc = snap.toObject(OtpDoc.class);
            if (otpDoc == null || !otpDoc.isVerified() || otpDoc.isUsed()) {
                throw new BadRequestException("OTP verification has not been completed or was already used.");
            }

            if (!verificationToken.trim().equals(otpDoc.getVerificationToken())) {
                throw new BadRequestException("Invalid verification token. Please verify the OTP again.");
            }

            if (otpDoc.getVerifiedAt() == null
                    || System.currentTimeMillis() - otpDoc.getVerifiedAt().getTime() > VERIFIED_TOKEN_TTL_MS) {
                otpDoc.setUsed(true);
                docRef.set(otpDoc).get();
                throw new BadRequestException("Verification expired. Please request a new OTP.");
            }

            if (consumeOnSuccess) {
                otpDoc.setUsed(true);
                docRef.set(otpDoc).get();
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to validate verification token for {}: {}", cleanEmail, e.getMessage());
            throw new RuntimeException("Unable to validate OTP verification: " + e.getMessage());
        }
    }

    public void markRegistrationTokenUsed(String email) {
        markTokenUsed(email, OtpPurpose.EMAIL_VERIFICATION);
    }

    private void markTokenUsed(String email, OtpPurpose purpose) {
        String cleanEmail = normalizeEmail(email);
        DocumentReference docRef = getDocRef(cleanEmail, purpose);
        try {
            DocumentSnapshot snap = docRef.get().get();
            if (snap.exists()) {
                OtpDoc otpDoc = snap.toObject(OtpDoc.class);
                if (otpDoc != null && !otpDoc.isUsed()) {
                    otpDoc.setUsed(true);
                    docRef.set(otpDoc).get();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to mark OTP token used for {}: {}", cleanEmail, e.getMessage());
        }
    }

    private DocumentReference getDocRef(String cleanEmail, OtpPurpose purpose) {
        String encodedEmail = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(cleanEmail.getBytes(StandardCharsets.UTF_8));
        String docId = purpose.name() + "_" + encodedEmail;
        return firestore.collection(OTP_COLLECTION).document(docId);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String hashOtp(String rawOtp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(rawOtp.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedHash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
