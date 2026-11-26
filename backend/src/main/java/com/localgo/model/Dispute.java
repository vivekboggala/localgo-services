package com.localgo.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a dispute raised by a customer or provider.
 */
public class Dispute {
    private String id; // UUID
    private String bookingId;
    private String raisedBy; // "customer" or "provider"
    private String reason;
    private String description;
    private Instant createdAt;
    private String status; // OPEN, RESOLVED, REJECTED

    public Dispute() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
        this.status = "OPEN";
    }
    public Dispute(String bookingId, String raisedBy, String reason, String description) {
        this();
        this.bookingId = bookingId;
        this.raisedBy = raisedBy;
        this.reason = reason;
        this.description = description;
    }

    public String getId() { return id; }
    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }
    public String getRaisedBy() { return raisedBy; }
    public void setRaisedBy(String raisedBy) { this.raisedBy = raisedBy; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Instant getCreatedAt() { return createdAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
