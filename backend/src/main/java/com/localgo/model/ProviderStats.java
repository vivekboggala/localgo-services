package com.localgo.model;

import java.util.List;
import java.util.ArrayList;
import java.time.Instant;

/**
 * Stores rolling statistics for a provider used by the dispatch ranking algorithm.
 * The stats are kept for the last `windowDays` days (configurable via PlatformConfig).
 */
public class ProviderStats {
    private String providerId;
    // timestamps of offers accepted (successful dispatches)
    private List<Instant> acceptedTimestamps = new ArrayList<>();
    // timestamps of offers rejected or cancelled by the provider
    private List<Instant> rejectedTimestamps = new ArrayList<>();
    // timestamps of strikes (e.g., cancellations after accept)
    private List<Instant> strikeTimestamps = new ArrayList<>();

    public ProviderStats() {}
    public ProviderStats(String providerId) {
        this.providerId = providerId;
    }

    public String getProviderId() { return providerId; }
    public void setProviderId(String providerId) { this.providerId = providerId; }
    public List<Instant> getAcceptedTimestamps() { return acceptedTimestamps; }
    public List<Instant> getRejectedTimestamps() { return rejectedTimestamps; }
    public List<Instant> getStrikeTimestamps() { return strikeTimestamps; }

    // Helper methods to add events
    public void recordAccepted() { acceptedTimestamps.add(Instant.now()); }
    public void recordRejected() { rejectedTimestamps.add(Instant.now()); }
    public void recordStrike() { strikeTimestamps.add(Instant.now()); }
}
