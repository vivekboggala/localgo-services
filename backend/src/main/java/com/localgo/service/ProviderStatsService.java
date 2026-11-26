package com.localgo.service;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.localgo.model.ProviderStats;
import com.localgo.model.PlatformConfig;
import java.util.concurrent.ExecutionException;
import java.time.Instant;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing provider statistics used in dispatch ranking and suspension.
 */
public class ProviderStatsService {
    private final Firestore db;
    private final CollectionReference statsCol;
    private final PlatformConfig config;

    public ProviderStatsService(Firestore db, PlatformConfig config) {
        this.db = db;
        this.config = config;
        this.statsCol = db.collection("provider_stats");
    }

    private ProviderStats getOrCreate(String providerId) throws ExecutionException, InterruptedException {
        var doc = statsCol.document(providerId).get().get();
        if (doc.exists()) {
            return doc.toObject(ProviderStats.class);
        } else {
            ProviderStats newStats = new ProviderStats(providerId);
            statsCol.document(providerId).set(newStats).get();
            return newStats;
        }
    }

    public void recordAccepted(String providerId) throws ExecutionException, InterruptedException {
        ProviderStats stats = getOrCreate(providerId);
        stats.recordAccepted();
        statsCol.document(providerId).set(stats).get();
    }

    public void recordRejected(String providerId) throws ExecutionException, InterruptedException {
        ProviderStats stats = getOrCreate(providerId);
        stats.recordRejected();
        statsCol.document(providerId).set(stats).get();
    }

    public void recordStrike(String providerId) throws ExecutionException, InterruptedException {
        ProviderStats stats = getOrCreate(providerId);
        stats.recordStrike();
        statsCol.document(providerId).set(stats).get();
    }

    /**
     * Compute acceptance rate over the rolling window defined in PlatformConfig.
     */
    public double acceptanceRate(String providerId) throws ExecutionException, InterruptedException {
        ProviderStats stats = getOrCreate(providerId);
        Instant cutoff = Instant.now().minus(Duration.ofDays(config.getStatsWindowDays()));
        long accepted = stats.getAcceptedTimestamps().stream().filter(t -> t.isAfter(cutoff)).count();
        long total = stats.getAcceptedTimestamps().stream().filter(t -> t.isAfter(cutoff)).count()
                + stats.getRejectedTimestamps().stream().filter(t -> t.isAfter(cutoff)).count();
        return total == 0 ? 0.0 : (double) accepted / total;
    }

    /**
     * Determine if provider is currently suspended due to strikes.
     */
    public boolean isSuspended(String providerId) throws ExecutionException, InterruptedException {
        ProviderStats stats = getOrCreate(providerId);
        Instant cutoff = Instant.now().minus(Duration.ofDays(config.getSuspensionWindowDays()));
        long recentStrikes = stats.getStrikeTimestamps().stream().filter(t -> t.isAfter(cutoff)).count();
        return recentStrikes >= config.getSuspensionStrikes();
    }
}
