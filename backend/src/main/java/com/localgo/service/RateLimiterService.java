package com.localgo.service;

import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.Instant;
import java.time.Duration;

/**
 * Simple in‑memory rate limiter for API endpoints.
 * In production this would be backed by Redis or a Token Bucket service.
 */
@Component
public class RateLimiterService {
    private static class Bucket {
        final int limit;
        final Duration window;
        final AtomicInteger count = new AtomicInteger(0);
        Instant windowStart = Instant.now();
        Bucket(int limit, Duration window) { this.limit = limit; this.window = window; }
    }

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    // key format: <endpoint>:<clientId>
    public boolean tryConsume(String key, int limit, Duration window) {
        Bucket bucket = buckets.computeIfAbsent(key, k -> new Bucket(limit, window));
        synchronized (bucket) {
            Instant now = Instant.now();
            if (Duration.between(bucket.windowStart, now).compareTo(bucket.window) > 0) {
                bucket.windowStart = now;
                bucket.count.set(0);
            }
            if (bucket.count.incrementAndGet() <= bucket.limit) {
                return true;
            } else {
                return false;
            }
        }
    }
}
