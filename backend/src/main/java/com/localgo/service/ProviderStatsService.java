package com.localgo.service;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.localgo.model.ProviderStats;
import com.localgo.model.PlatformConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ExecutionException;

/**
 * Service for managing provider statistics used in dispatch ranking and suspension.
 */
@Service
@Slf4j
public class ProviderStatsService {

    private final Firestore db;
    private final CollectionReference statsCol;
    private final PlatformConfigService configService;

    public ProviderStatsService(Firestore db, PlatformConfigService configService) {
        this.db = db;
        this.configService = configService;
        this.statsCol = db.collection("provider_stats");
    }

    @Scheduled(cron = "0 0 * * * *") // hourly
    public void cleanupOldStats() throws ExecutionException, InterruptedException {
        PlatformConfig config = configService.getConfig();
        Instant cutoff = Instant.now().minus(Duration.ofDays(config.getStatsWindowDays()));
        var docs = statsCol.listDocuments();
        for (var docRef : docs) {
            var snapshot = docRef.get().get();
            if (!snapshot.exists()) continue;
            ProviderStats stats = snapshot.toObject(ProviderStats.class);
            if (stats == null) continue;
            stats.getAcceptedTimestamps().removeIf(t -> t.isBefore(cutoff));
            stats.getRejectedTimestamps().removeIf(t -> t.isBefore(cutoff));
            stats.getStrikeTimestamps().removeIf(t -> t.isBefore(cutoff));
            docRef.set(stats).get();
        }
    }

    private ProviderStats getOrCreate(String providerId) throws ExecutionException, InterruptedException {
        var doc = statsCol.document(providerId).get().get();
        if (doc.exists()) {
            ProviderStats stats = doc.toObject(ProviderStats.class);
            return stats != null ? stats : new ProviderStats(providerId);
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
        PlatformConfig config = configService.getConfig();
        ProviderStats stats = getOrCreate(providerId);
        Instant cutoff = Instant.now().minus(Duration.ofDays(config.getStatsWindowDays()));
        long accepted = stats.getAcceptedTimestamps().stream().filter(t -> t.isAfter(cutoff)).count();
        long totalRejected = stats.getRejectedTimestamps().stream().filter(t -> t.isAfter(cutoff)).count();
        long total = accepted + totalRejected;
        return total == 0 ? 1.0 : (double) accepted / total;
    }

    /**
     * Determine if provider is currently suspended due to strikes.
     */
    public boolean isSuspended(String providerId) throws ExecutionException, InterruptedException {
        PlatformConfig config = configService.getConfig();
        ProviderStats stats = getOrCreate(providerId);
        Instant cutoff = Instant.now().minus(Duration.ofDays(config.getSuspensionWindowDays()));
        long recentStrikes = stats.getStrikeTimestamps().stream().filter(t -> t.isAfter(cutoff)).count();
        return recentStrikes >= config.getSuspensionStrikes();
    }
}
