package com.localgo.exception;

/**
 * Thrown when an authenticated caller lacks ownership or permission for a resource (HTTP 403).
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
