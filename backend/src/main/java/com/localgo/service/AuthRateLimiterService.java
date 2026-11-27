package com.localgo.service;

import com.localgo.exception.RateLimitExceededException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Per-IP and per-email Bucket4j rate limiting for public authentication and OTP endpoints.
 */
@Service
@Slf4j
public class AuthRateLimiterService {

    public enum LimitType {
        OTP_SEND,
        OTP_VERIFY
    }

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public void checkLimit(HttpServletRequest request, String email, LimitType limitType) {
        String ip = extractClientIp(request);
        String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
        checkLimit(ip, normalizedEmail, limitType);
    }

    public void checkLimit(String ip, String normalizedEmail, LimitType limitType) {
        String cleanIp = (ip != null && !ip.isBlank()) ? ip.trim() : "unknown";
        String ipKey = limitType.name() + ":ip:" + cleanIp;
        Bucket ipBucket = buckets.computeIfAbsent(ipKey, k -> buildIpBucket(limitType));
        ConsumptionProbe ipProbe = ipBucket.tryConsumeAndReturnRemaining(1);
        if (!ipProbe.isConsumed()) {
            long waitSeconds = Math.max(1L, TimeUnit.NANOSECONDS.toSeconds(ipProbe.getNanosToWaitForRefill()) + 1L);
            log.warn("Rate limit exceeded for IP {} on {}", cleanIp, limitType);
            throw new RateLimitExceededException(
                    "Too many requests from your network. Please wait " + waitSeconds + " seconds before trying again.",
                    waitSeconds
            );
        }

        if (normalizedEmail != null && !normalizedEmail.isBlank()) {
            String emailKey = limitType.name() + ":email:" + normalizedEmail.trim().toLowerCase();
            Bucket emailBucket = buckets.computeIfAbsent(emailKey, k -> buildEmailBucket(limitType));
            ConsumptionProbe emailProbe = emailBucket.tryConsumeAndReturnRemaining(1);
            if (!emailProbe.isConsumed()) {
                long waitSeconds = Math.max(1L, TimeUnit.NANOSECONDS.toSeconds(emailProbe.getNanosToWaitForRefill()) + 1L);
                log.warn("Rate limit exceeded for email {} on {}", normalizedEmail, limitType);
                throw new RateLimitExceededException(
                        "Too many OTP attempts for this email. Please wait " + waitSeconds + " seconds before trying again.",
                        waitSeconds
                );
            }
        }
    }

    public void clearAll() {
        buckets.clear();
    }

    private Bucket buildEmailBucket(LimitType limitType) {
        if (limitType == LimitType.OTP_SEND) {
            return Bucket.builder()
                    .addLimit(Bandwidth.builder()
                            .capacity(3)
                            .refillIntervally(3, Duration.ofMinutes(2))
                            .build())
                    .build();
        }
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(6)
                        .refillIntervally(6, Duration.ofMinutes(5))
                        .build())
                .build();
    }

    private Bucket buildIpBucket(LimitType limitType) {
        if (limitType == LimitType.OTP_SEND) {
            return Bucket.builder()
                    .addLimit(Bandwidth.builder()
                            .capacity(12)
                            .refillIntervally(12, Duration.ofMinutes(5))
                            .build())
                    .build();
        }
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(20)
                        .refillIntervally(20, Duration.ofMinutes(5))
                        .build())
                .build();
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        String remoteAddr = request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
        if (isTrustedProxy(remoteAddr)) {
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                String[] parts = xff.split(",");
                String first = parts[0].trim();
                if (!first.isEmpty()) return first;
            }
            String realIp = request.getHeader("X-Real-IP");
            if (realIp != null && !realIp.isBlank()) {
                return realIp.trim();
            }
        }
        return remoteAddr;
    }

    private boolean isTrustedProxy(String ip) {
        return ip.equals("127.0.0.1")
                || ip.equals("::1")
                || ip.equals("0:0:0:0:0:0:0:1")
                || ip.startsWith("10.")
                || ip.startsWith("192.168.")
                || ip.matches("^172\\.(1[6-9]|2\\d|3[0-1])\\..*");
    }
}
