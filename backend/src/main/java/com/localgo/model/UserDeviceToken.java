package com.localgo.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * Stores a user's device FCM token. Multiple devices per user are allowed.
 * Tokens are considered stale after a send error and are cleaned up periodically.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDeviceToken {
    private String id;               // Firestore document ID (auto-generated)
    private String uid;              // Firebase Auth UID of the user (customer or provider)
    private String token;            // FCM registration token
    private Date createdAt;
    private Date lastUsedAt;
    private boolean disabled;       // Marked true when a send error occurs
}
