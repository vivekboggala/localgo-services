package com.localgo.service;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Helper service to resolve a user's role from Firestore by UID.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserLookupService {

    private final Firestore firestore;

    public String getRole(String uid) {
        if (uid == null || uid.isBlank()) {
            return "UNKNOWN";
        }
        try {
            DocumentSnapshot doc = firestore.collection("users").document(uid).get().get();
            if (doc.exists() && doc.contains("role")) {
                String role = doc.getString("role");
                return role != null ? role : "CUSTOMER";
            }
        } catch (Exception e) {
            log.warn("Failed to look up role for uid {}: {}", uid, e.getMessage());
        }
        return "CUSTOMER";
    }
}
