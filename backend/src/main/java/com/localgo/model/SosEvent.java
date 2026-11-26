package com.localgo.model;

import java.time.Instant;
import java.util.UUID;

/**
 * SOS event raised by a provider or customer during a job.
 * Contains a snapshot of location and timestamp; admin can acknowledge.
 */
public class SosEvent {
    private String id; // UUID
    private String bookingId;
    private String raisedBy; // "provider" or "customer"
    private Instant createdAt;
    private double latitude;
    private double longitude;
    private String status; // "OPEN", "ACKNOWLEDGED", "RESOLVED"

    public SosEvent() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
        this.status = "OPEN";
    }
    public SosEvent(String bookingId, String raisedBy, double latitude, double longitude) {
        this();
        this.bookingId = bookingId;
        this.raisedBy = raisedBy;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getId() { return id; }
    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }
    public String getRaisedBy() { return raisedBy; }
    public void setRaisedBy(String raisedBy) { this.raisedBy = raisedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
