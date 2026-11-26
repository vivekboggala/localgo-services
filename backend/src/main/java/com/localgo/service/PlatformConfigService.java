package com.localgo.service;

import com.google.cloud.firestore.Firestore;
import com.localgo.model.PlatformConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;

/**
 * Service for reading PlatformConfig from Firestore collection "config" document "platform".
 * Returns safe defaults if the document does not exist.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlatformConfigService {

    private final Firestore firestore;

    private static final String CONFIG_COLLECTION = "config";
    private static final String PLATFORM_DOC = "platform";

    public PlatformConfig getConfig() {
        try {
            var snap = firestore.collection(CONFIG_COLLECTION).document(PLATFORM_DOC).get().get();
            if (snap.exists()) {
                PlatformConfig cfg = snap.toObject(PlatformConfig.class);
                if (cfg != null) return applyDefaults(cfg);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Interrupted reading platform config, using defaults");
        } catch (ExecutionException e) {
            log.warn("Failed to read platform config from Firestore: {}", e.getMessage());
        }
        return defaults();
    }

    private PlatformConfig applyDefaults(PlatformConfig cfg) {
        if (cfg.getCommissionBps() == null)             cfg.setCommissionBps(750L);
        if (cfg.getOfferTimeoutSec() == null)           cfg.setOfferTimeoutSec(120L);
        if (cfg.getParallelOffers() == null)            cfg.setParallelOffers(3L);
        if (cfg.getMaxDispatchSeconds() == null)        cfg.setMaxDispatchSeconds(600L);
        if (cfg.getCancellationFeeBps() == null)        cfg.setCancellationFeeBps(0L);
        if (cfg.getCompletionAutoConfirmHours() == null) cfg.setCompletionAutoConfirmHours(24L);
        if (cfg.getDisputeWindowHours() == null)        cfg.setDisputeWindowHours(48L);
        if (cfg.getStatsWindowDays() == null)           cfg.setStatsWindowDays(30L);
        if (cfg.getSuspensionStrikes() == null)         cfg.setSuspensionStrikes(3L);
        if (cfg.getSuspensionWindowDays() == null)      cfg.setSuspensionWindowDays(7L);
        if (cfg.getVisitFeeBps() == null)               cfg.setVisitFeeBps(0L);
        if (cfg.getEnablePhase0() == null)              cfg.setEnablePhase0(true);
        if (cfg.getEnablePhase1() == null)              cfg.setEnablePhase1(true);
        if (cfg.getEnablePhase2() == null)              cfg.setEnablePhase2(true);
        if (cfg.getEnablePhase3() == null)              cfg.setEnablePhase3(true);
        if (cfg.getEnablePhase4() == null)              cfg.setEnablePhase4(true);
        if (cfg.getEnablePhase5() == null)              cfg.setEnablePhase5(true);
        if (cfg.getEnablePhase6() == null)              cfg.setEnablePhase6(true);
        return cfg;
    }

    private PlatformConfig defaults() {
        return PlatformConfig.builder()
                .commissionBps(750L)
                .offerTimeoutSec(120L)
                .parallelOffers(3L)
                .maxDispatchSeconds(600L)
                .cancellationFeeBps(0L)
                .completionAutoConfirmHours(24L)
                .disputeWindowHours(48L)
                .statsWindowDays(30L)
                .suspensionStrikes(3L)
                .suspensionWindowDays(7L)
                .visitFeeBps(0L)
                .enablePhase0(true)
                .enablePhase1(true)
                .enablePhase2(true)
                .enablePhase3(true)
                .enablePhase4(true)
                .enablePhase5(true)
                .enablePhase6(true)
                .build();
    }
}
