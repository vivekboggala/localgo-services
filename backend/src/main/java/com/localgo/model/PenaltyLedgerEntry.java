package com.localgo.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a penalty entry for a provider (or optionally a customer).
 * Penalties are recorded in the provider's ledger and affect suspension logic.
 */
public class PenaltyLedgerEntry {
    private String id; // UUID
    private String providerId;
    private String reason;
    private Instant createdAt;
    private int severity; // 1 = warning, higher = stronger penalty

    public PenaltyLedgerEntry() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
    }
    public PenaltyLedgerEntry(String providerId, String reason, int severity) {
        this();
        this.providerId = providerId;
        this.reason = reason;
        this.severity = severity;
    }

    public String getId() { return id; }
    public String getProviderId() { return providerId; }
    public void setProviderId(String providerId) { this.providerId = providerId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Instant getCreatedAt() { return createdAt; }
    public int getSeverity() { return severity; }
    public void setSeverity(int severity) { this.severity = severity; }
}
