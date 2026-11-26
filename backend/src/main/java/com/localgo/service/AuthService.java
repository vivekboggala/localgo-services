package com.localgo.service;

import ch.hsr.geohash.GeoHash;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.localgo.dto.request.ForgotPasswordRequest;
import com.localgo.dto.request.ProviderRegisterRequest;
import com.localgo.dto.request.RegisterRequest;
import com.localgo.dto.request.ResendOtpRequest;
import com.localgo.dto.request.ResetPasswordRequest;
import com.localgo.dto.request.VerifyOtpRequest;
import com.localgo.dto.response.AuthResponse;
import com.localgo.dto.response.UserResponse;
import com.localgo.enums.OtpPurpose;
import com.localgo.enums.Role;
import com.localgo.exception.BadRequestException;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.model.ProviderDoc;
import com.localgo.model.ProviderServiceItem;
import com.localgo.model.ServiceDoc;
import com.localgo.model.UserDoc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final Firestore firestore;
    private final FirebaseAuth firebaseAuth;
    private final OtpService otpService;

    public void sendOtp(ResendOtpRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        OtpPurpose purpose = request.getPurpose();

        if (purpose == OtpPurpose.EMAIL_VERIFICATION) {
            if (isEmailVerifiedAndRegistered(cleanEmail)) {
                throw new BadRequestException("An account with this email already exists. Please sign in.");
            }
            otpService.generateAndSendOtp(cleanEmail, OtpPurpose.EMAIL_VERIFICATION);
        } else {
            if (isEmailRegistered(cleanEmail)) {
                otpService.generateAndSendOtp(cleanEmail, OtpPurpose.PASSWORD_RESET);
            } else {
                log.info("Password reset OTP requested for unregistered email {}", cleanEmail);
            }
        }
    }

    public Map<String, Object> verifyEmailOtp(VerifyOtpRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        String verificationToken = otpService.verifyOtp(cleanEmail, request.getOtp(), OtpPurpose.EMAIL_VERIFICATION);
        boolean existingVerified = markExistingUserEmailVerifiedIfPresent(cleanEmail);
        if (existingVerified) {
            otpService.markRegistrationTokenUsed(cleanEmail);
        }
        return Map.of(
                "verified", true,
                "email", cleanEmail,
                "existingAccount", existingVerified,
                "verificationToken", verificationToken
        );
    }

    public AuthResponse registerCustomerWithOtp(RegisterRequest request, String authenticatedUid) {
        otpService.validateVerifiedRegistrationToken(request.getEmail(), request.getOtpVerificationToken());
        AuthResponse response = registerCustomer(request, authenticatedUid);
        otpService.markRegistrationTokenUsed(request.getEmail());
        return response;
    }

    public AuthResponse registerProviderWithOtp(ProviderRegisterRequest request, String authenticatedUid) {
        otpService.validateVerifiedRegistrationToken(request.getEmail(), request.getOtpVerificationToken());
        AuthResponse response = registerProvider(request, authenticatedUid);
        otpService.markRegistrationTokenUsed(request.getEmail());
        return response;
    }

    public AuthResponse registerCustomer(RegisterRequest request, String authenticatedUid) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        String uid = authenticatedUid != null ? authenticatedUid : request.getUid();

        if (uid == null || uid.isBlank()) {
            uid = createOrUpdateFirebaseUser(cleanEmail, request.getPassword(), request.getName(), request.getPhone(), "Registration");
        }

        UserDoc userDoc = UserDoc.builder()
                .id(uid)
                .name(request.getName().trim())
                .email(cleanEmail)
                .phone(request.getPhone() != null ? request.getPhone().trim() : "")
                .role(Role.CUSTOMER.name())
                .emailVerified(true)
                .createdAt(new Date())
                .build();

        try {
            firestore.collection("users").document(uid).set(userDoc).get();
        } catch (Exception e) {
            log.error("Failed to save user doc in Firestore: {}", e.getMessage());
            throw new RuntimeException("Error saving user profile: " + e.getMessage());
        }

        UserResponse userResponse = mapToUserResponse(userDoc);
        return AuthResponse.builder()
                .token(null) // Token managed by Firebase Auth on client
                .user(userResponse)
                .build();
    }

    public AuthResponse registerProvider(ProviderRegisterRequest request, String authenticatedUid) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        String uid = authenticatedUid != null ? authenticatedUid : request.getUid();

        if (uid == null || uid.isBlank()) {
            uid = createOrUpdateFirebaseUser(cleanEmail, request.getPassword(), request.getName(), request.getPhone(), "Provider registration");
        }

        UserDoc userDoc = UserDoc.builder()
                .id(uid)
                .name(request.getName().trim())
                .email(cleanEmail)
                .phone(request.getPhone() != null ? request.getPhone().trim() : "")
                .role(Role.PROVIDER.name())
                .emailVerified(true)
                .createdAt(new Date())
                .build();

        String serviceName = "General Service";
        try {
            var serviceDocSnap = firestore.collection("services").document(request.getPrimaryServiceId()).get().get();
            if (serviceDocSnap.exists()) {
                ServiceDoc s = serviceDocSnap.toObject(ServiceDoc.class);
                if (s != null && s.getName() != null) {
                    serviceName = s.getName();
                }
            }
        } catch (Exception e) {
            log.warn("Could not look up service name for {}: {}", request.getPrimaryServiceId(), e.getMessage());
        }

        String geohash = GeoHash.withCharacterPrecision(request.getLatitude(), request.getLongitude(), 12).toBase32();
        long priceInPaise = Math.round(request.getStartingPrice() * 100.0);

        ProviderServiceItem serviceItem = ProviderServiceItem.builder()
                .serviceId(request.getPrimaryServiceId())
                .serviceName(serviceName)
                .startingPrice(priceInPaise)
                .build();

        ProviderDoc providerDoc = ProviderDoc.builder()
                .id(uid)
                .name(request.getName().trim())
                .email(cleanEmail)
                .phone(request.getPhone() != null ? request.getPhone().trim() : "")
                .description(request.getDescription())
                .experienceYears(request.getExperienceYears())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .serviceRadiusKm(request.getServiceRadiusKm() != null ? request.getServiceRadiusKm() : 10.0)
                .geohash(geohash)
                .verificationStatus("PENDING")
                .rating(0.0)
                .completedJobs(0)
                .available(false)
                .manualOffline(false)
                .services(List.of(serviceItem))
                .build();

        try {
            firestore.collection("users").document(uid).set(userDoc).get();
            firestore.collection("providers").document(uid).set(providerDoc).get();
        } catch (Exception e) {
            log.error("Failed to save provider in Firestore: {}", e.getMessage());
            throw new RuntimeException("Error saving provider profile: " + e.getMessage());
        }

        UserResponse userResponse = mapToUserResponse(userDoc);
        userResponse.setProviderProfileId(uid);
        return AuthResponse.builder()
                .token(null)
                .user(userResponse)
                .build();
    }

    public String forgotPassword(ForgotPasswordRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (isEmailRegistered(cleanEmail)) {
            otpService.generateAndSendOtp(cleanEmail, OtpPurpose.PASSWORD_RESET);
        } else {
            log.info("Forgot password requested for non-existent email {}", cleanEmail);
        }
        return "If an account exists for this email, a verification code has been sent.";
    }

    public Map<String, Object> verifyPasswordResetOtp(VerifyOtpRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        String verificationToken = otpService.verifyOtp(cleanEmail, request.getOtp(), OtpPurpose.PASSWORD_RESET);
        return Map.of(
                "verified", true,
                "verificationToken", verificationToken
        );
    }

    public void resetPassword(ResetPasswordRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (request.getVerificationToken() != null && !request.getVerificationToken().isBlank()) {
            otpService.validateAndConsumeResetToken(cleanEmail, request.getVerificationToken());
        } else if (request.getOtp() != null && !request.getOtp().isBlank()) {
            otpService.verifyOtp(cleanEmail, request.getOtp(), OtpPurpose.PASSWORD_RESET);
            otpService.consumeResetOtp(cleanEmail);
        } else {
            throw new BadRequestException("OTP verification is required before resetting your password.");
        }

        try {
            UserRecord record = firebaseAuth.getUserByEmail(cleanEmail);
            firebaseAuth.updateUser(
                    new UserRecord.UpdateRequest(record.getUid()).setPassword(request.getNewPassword())
            );
        } catch (FirebaseAuthException e) {
            log.error("Failed to reset password in Firebase Auth for {}: {}", cleanEmail, e.getMessage());
            throw new BadRequestException("Account not found for password reset.");
        }
    }

    public UserResponse getCurrentUser(String uid) {
        try {
            var userSnap = firestore.collection("users").document(uid).get().get();
            if (userSnap.exists()) {
                UserDoc userDoc = userSnap.toObject(UserDoc.class);
                if (userDoc != null) {
                    userDoc.setId(uid);
                    UserResponse resp = mapToUserResponse(userDoc);
                    if (Role.PROVIDER.name().equalsIgnoreCase(userDoc.getRole())) {
                        resp.setProviderProfileId(uid);
                    }
                    return resp;
                }
            }

            UserRecord record = firebaseAuth.getUser(uid);
            UserDoc newUser = UserDoc.builder()
                    .id(uid)
                    .name(record.getDisplayName() != null ? record.getDisplayName() : "User")
                    .email(record.getEmail())
                    .phone(record.getPhoneNumber() != null ? record.getPhoneNumber() : "")
                    .role(Role.CUSTOMER.name())
                    .emailVerified(record.isEmailVerified())
                    .createdAt(new Date())
                    .build();
            firestore.collection("users").document(uid).set(newUser).get();
            return mapToUserResponse(newUser);
        } catch (Exception e) {
            log.error("Failed to get current user for uid {}: {}", uid, e.getMessage());
            throw new ResourceNotFoundException("User not found: " + e.getMessage());
        }
    }

    public UserResponse getUserById(String uid) {
        return getCurrentUser(uid);
    }

    private boolean isEmailVerifiedAndRegistered(String cleanEmail) {
        boolean firebaseExists = false;
        boolean firebaseVerified = false;
        try {
            UserRecord record = firebaseAuth.getUserByEmail(cleanEmail);
            firebaseExists = true;
            firebaseVerified = record.isEmailVerified();
        } catch (FirebaseAuthException ignored) {
        }

        try {
            var docs = firestore.collection("users")
                    .whereEqualTo("email", cleanEmail)
                    .limit(1)
                    .get()
                    .get()
                    .getDocuments();
            if (!docs.isEmpty()) {
                Boolean verifiedField = docs.get(0).getBoolean("emailVerified");
                if (Boolean.FALSE.equals(verifiedField)) {
                    return false;
                }
                return true;
            }
        } catch (Exception e) {
            log.warn("Error checking Firestore for email {}: {}", cleanEmail, e.getMessage());
        }
        return firebaseExists && firebaseVerified;
    }

    private String createOrUpdateFirebaseUser(String cleanEmail, String password, String name, String phone, String label) {
        if (password == null || password.trim().length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters.");
        }
        String trimmedName = name != null ? name.trim() : "User";

        try {
            UserRecord existing = firebaseAuth.getUserByEmail(cleanEmail);
            if (existing != null) {
                var userSnap = firestore.collection("users").document(existing.getUid()).get().get();
                if (userSnap.exists() && !Boolean.FALSE.equals(userSnap.getBoolean("emailVerified"))) {
                    throw new BadRequestException("An account with this email already exists. Please sign in.");
                }
                UserRecord.UpdateRequest updateReq = new UserRecord.UpdateRequest(existing.getUid())
                        .setPassword(password)
                        .setDisplayName(trimmedName)
                        .setEmailVerified(true);
                firebaseAuth.updateUser(updateReq);
                return existing.getUid();
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (FirebaseAuthException ignored) {
        } catch (Exception e) {
            log.warn("Error checking existing Firebase user for {}: {}", cleanEmail, e.getMessage());
        }

        try {
            UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                    .setEmail(cleanEmail)
                    .setPassword(password)
                    .setDisplayName(trimmedName)
                    .setEmailVerified(true);
            if (phone != null && phone.trim().startsWith("+")) {
                createRequest.setPhoneNumber(phone.trim());
            }
            UserRecord record = firebaseAuth.createUser(createRequest);
            return record.getUid();
        } catch (Exception e) {
            log.error("Failed to create Firebase user ({}): {}", label, e.getMessage());
            throw new BadRequestException(label + " failed: " + e.getMessage());
        }
    }

    private boolean markExistingUserEmailVerifiedIfPresent(String cleanEmail) {
        boolean updated = false;
        try {
            UserRecord record = firebaseAuth.getUserByEmail(cleanEmail);
            if (!record.isEmailVerified()) {
                firebaseAuth.updateUser(new UserRecord.UpdateRequest(record.getUid()).setEmailVerified(true));
            }
            var userRef = firestore.collection("users").document(record.getUid());
            if (userRef.get().get().exists()) {
                userRef.update("emailVerified", true).get();
                updated = true;
            }
        } catch (FirebaseAuthException ignored) {
        } catch (Exception e) {
            log.warn("Error updating emailVerified on existing user {}: {}", cleanEmail, e.getMessage());
        }
        if (!updated) {
            try {
                var docs = firestore.collection("users")
                        .whereEqualTo("email", cleanEmail)
                        .limit(1)
                        .get()
                        .get()
                        .getDocuments();
                if (!docs.isEmpty()) {
                    docs.get(0).getReference().update("emailVerified", true).get();
                    updated = true;
                }
            } catch (Exception e) {
                log.warn("Error updating Firestore emailVerified for {}: {}", cleanEmail, e.getMessage());
            }
        }
        return updated;
    }

    private boolean isEmailRegistered(String cleanEmail) {
        try {
            firebaseAuth.getUserByEmail(cleanEmail);
            return true;
        } catch (FirebaseAuthException ignored) {
        }
        try {
            var docs = firestore.collection("users")
                    .whereEqualTo("email", cleanEmail)
                    .limit(1)
                    .get()
                    .get()
                    .getDocuments();
            return !docs.isEmpty();
        } catch (Exception e) {
            log.warn("Error checking Firestore for email {}: {}", cleanEmail, e.getMessage());
            return false;
        }
    }

    private UserResponse mapToUserResponse(UserDoc doc) {
        Role r = Role.CUSTOMER;
        if (doc.getRole() != null) {
            if (doc.getRole().equalsIgnoreCase(Role.ADMIN.name())) {
                r = Role.ADMIN;
            } else if (doc.getRole().equalsIgnoreCase(Role.PROVIDER.name())) {
                r = Role.PROVIDER;
            }
        }
        return UserResponse.builder()
                .id(doc.getId())
                .name(doc.getName())
                .email(doc.getEmail())
                .phone(doc.getPhone())
                .role(r)
                .emailVerified(!Boolean.FALSE.equals(doc.getEmailVerified()))
                .build();
    }
}
