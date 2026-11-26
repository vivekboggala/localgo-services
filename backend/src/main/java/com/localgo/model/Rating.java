package com.localgo.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Private rating given by a provider to a customer.
 * Stored per booking; aggregated only for admin view.
 */
public class Rating {
    private String id; // UUID
    private String bookingId;
    private String providerId;
    private String customerId;
    private int rating; // 1-5 stars
    private String comments;
    private Instant createdAt;

    public Rating() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
    }
    public Rating(String bookingId, String providerId, String customerId, int rating, String comments) {
        this();
        this.bookingId = bookingId;
        this.providerId = providerId;
        this.customerId = customerId;
        this.rating = rating;
        this.comments = comments;
    }

    public String getId() { return id; }
    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }
    public String getProviderId() { return providerId; }
    public void setProviderId(String providerId) { this.providerId = providerId; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    public Instant getCreatedAt() { return createdAt; }
}
