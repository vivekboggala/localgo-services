package com.localgo.exception;

import lombok.Getter;

/**
 * Thrown when a client exceeds an endpoint rate limit (HTTP 429).
 */
@Getter
public class RateLimitExceededException extends RuntimeException {
    private final long retryAfterSeconds;

    public RateLimitExceededException(String message, long retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = Math.max(1L, retryAfterSeconds);
    }
}
