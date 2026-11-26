package com.localgo.service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ExecutionException;

/**
 * Distributed lock helper using Firestore as the coordination store.
 * A lock document is written with an expiry; if the document exists and has not expired,
 * the lock is considered held. Only one JVM instance can hold a named lock at a time.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SystemLockHelper {

    private final Firestore firestore;

    private static final String LOCKS_COLLECTION = "system_locks";

    /**
     * Attempt to acquire a named lock with a TTL in milliseconds.
     *
     * @param name      unique lock name
     * @param ttlMs     time to live in milliseconds; after this the lock is auto-released
     * @return true if acquired, false if already held by another instance
     */
    public boolean acquire(String name, long ttlMs) {
        try {
            DocumentReference ref = firestore.collection(LOCKS_COLLECTION).document(name);
            return firestore.runTransaction(tx -> {
                var snap = tx.get(ref).get();
                long now = System.currentTimeMillis();
                if (snap.exists()) {
                    Long expiresAt = snap.getLong("expiresAt");
                    if (expiresAt != null && expiresAt > now) {
                        return false; // lock is still held
                    }
                }
                // Write or overwrite the lock document
                tx.set(ref, java.util.Map.of(
                        "acquiredAt", now,
                        "expiresAt", now + ttlMs
                ));
                return true;
            }).get();
        } catch (Exception e) {
            log.warn("Error acquiring lock '{}': {}", name, e.getMessage());
            return false;
        }
    }

    /**
     * Release a named lock.
     *
     * @param name unique lock name
     */
    public void release(String name) {
        try {
            firestore.collection(LOCKS_COLLECTION).document(name).delete().get();
        } catch (Exception e) {
            log.warn("Error releasing lock '{}': {}", name, e.getMessage());
        }
    }
}
