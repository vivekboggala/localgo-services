package com.localgo.service;

import ch.hsr.geohash.GeoHash;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import com.localgo.dto.request.LoginRequest;
import com.localgo.dto.request.ProviderRegisterRequest;
import com.localgo.dto.request.RegisterRequest;
import com.localgo.dto.response.AuthResponse;
import com.localgo.dto.response.UserResponse;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final Firestore firestore;
    private final FirebaseAuth firebaseAuth;

    public AuthResponse registerCustomer(RegisterRequest request, String authenticatedUid) {
        String uid = authenticatedUid != null ? authenticatedUid : request.getUid();
        if (uid == null || uid.isBlank()) {
            try {
                // If UID not provided, create user in Firebase Auth
                UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                        .setEmail(request.getEmail())
                        .setPassword(request.getPassword())
                        .setDisplayName(request.getName())
                        .setPhoneNumber(request.getPhone().startsWith("+") ? request.getPhone() : null);
                UserRecord record = firebaseAuth.createUser(createRequest);
                uid = record.getUid();
            } catch (Exception e) {
                log.error("Failed to create Firebase user: {}", e.getMessage());
                throw new BadRequestException("Registration failed: " + e.getMessage());
            }
        }

        UserDoc userDoc = UserDoc.builder()
                .id(uid)
                .name(request.getName())
                .email(request.getEmail().toLowerCase())
                .phone(request.getPhone())
                .role(Role.CUSTOMER.name())
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
        String uid = authenticatedUid != null ? authenticatedUid : request.getUid();
        if (uid == null || uid.isBlank()) {
            try {
                UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                        .setEmail(request.getEmail())
                        .setPassword(request.getPassword())
                        .setDisplayName(request.getName())
                        .setPhoneNumber(request.getPhone().startsWith("+") ? request.getPhone() : null);
                UserRecord record = firebaseAuth.createUser(createRequest);
                uid = record.getUid();
            } catch (Exception e) {
                log.error("Failed to create Firebase provider user: {}", e.getMessage());
                throw new BadRequestException("Provider registration failed: " + e.getMessage());
            }
        }

        // Save User document
        UserDoc userDoc = UserDoc.builder()
                .id(uid)
                .name(request.getName())
                .email(request.getEmail().toLowerCase())
                .phone(request.getPhone())
                .role(Role.PROVIDER.name())
                .createdAt(new Date())
                .build();

        // Determine service name
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

        // Compute 12-char base32 geohash
        String geohash = GeoHash.withCharacterPrecision(request.getLatitude(), request.getLongitude(), 12).toBase32();

        // Price in paise (smallest currency unit)
        long priceInPaise = Math.round(request.getStartingPrice() * 100.0);

        ProviderServiceItem serviceItem = ProviderServiceItem.builder()
                .serviceId(request.getPrimaryServiceId())
                .serviceName(serviceName)
                .startingPrice(priceInPaise)
                .build();

        ProviderDoc providerDoc = ProviderDoc.builder()
                .id(uid)
                .name(request.getName())
                .email(request.getEmail().toLowerCase())
                .phone(request.getPhone())
                .description(request.getDescription())
                .experienceYears(request.getExperienceYears())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .serviceRadiusKm(request.getServiceRadiusKm() != null ? request.getServiceRadiusKm() : 10.0)
                .geohash(geohash)
                .verificationStatus("PENDING")
                .rating(0.0)
                .completedJobs(0)
                .available(true)
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

            // Fallback: look up in Firebase Auth
            UserRecord record = firebaseAuth.getUser(uid);
            UserDoc newUser = UserDoc.builder()
                    .id(uid)
                    .name(record.getDisplayName() != null ? record.getDisplayName() : "User")
                    .email(record.getEmail())
                    .phone(record.getPhoneNumber() != null ? record.getPhoneNumber() : "")
                    .role(Role.CUSTOMER.name())
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

    private UserResponse mapToUserResponse(UserDoc doc) {
        Role r = Role.CUSTOMER;
        if (doc.getRole() != null && doc.getRole().equalsIgnoreCase(Role.PROVIDER.name())) {
            r = Role.PROVIDER;
        }
        return UserResponse.builder()
                .id(doc.getId())
                .name(doc.getName())
                .email(doc.getEmail())
                .phone(doc.getPhone())
                .role(r)
                .emailVerified(true)
                .build();
    }
}
