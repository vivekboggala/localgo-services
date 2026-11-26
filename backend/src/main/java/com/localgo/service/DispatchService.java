package com.localgo.service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.localgo.enums.BookingStatus;
import com.localgo.exception.BadRequestException;
import com.localgo.exception.ForbiddenException;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.model.BookingDoc;
import com.localgo.model.DispatchOffer;
import com.localgo.model.PlatformConfig;
import com.localgo.model.ProviderDoc;
import com.localgo.util.GeoUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

/**
 * Dispatch engine – creates offers for eligible providers and manages their lifecycle.
 */
@Service
@Slf4j
@AllArgsConstructor
public class DispatchService {
    private final Firestore firestore;
    private final PlatformConfigService configService;
    private final SystemLockHelper lockHelper;
    private final RateLimiterService rateLimiterService;
    private final ProviderStatsService providerStatsService;
    private final BookingStateMachine bookingStateMachine;

    private static final String OFFERS_COLLECTION = "dispatch_offers";
    private static final String PROVIDERS_COLLECTION = "providers";
    private static final String BOOKINGS_COLLECTION = "bookings";
    private static final String OFFER_PENDING = "PENDING";

    /**
     * Starts a dispatch for a booking that is in DISPATCHING status (or moves it to that status).
     * Creates the first wave of offers to the top {@code parallelOffers} providers.
     */
    public void startDispatch(String bookingId, boolean instantMode) {
        PlatformConfig cfg = configService.getConfig();
        if (cfg.getEnablePhase6() != null && !cfg.getEnablePhase6()) {
            log.info("Dispatch start skipped for bookingId={} because enablePhase6 flag is false", bookingId);
            return;
        }
        try {
            BookingDoc booking = firestore.collection(BOOKINGS_COLLECTION).document(bookingId)
                    .get().get().toObject(BookingDoc.class);
            if (booking == null) {
                throw new ResourceNotFoundException("Booking not found: " + bookingId);
            }
            if (!BookingStatus.DISPATCHING.name().equalsIgnoreCase(booking.getStatus())) {
                bookingStateMachine.transition(
                        bookingId,
                        BookingStatus.valueOf(booking.getStatus()),
                        BookingStatus.DISPATCHING,
                        "SYSTEM",
                        Map.of("instant", instantMode),
                        null);
            }
            createOfferWave(bookingId, 1);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error starting dispatch for bookingId={}: {}", bookingId, e.getMessage());
            throw new RuntimeException("Error starting dispatch: " + e.getMessage(), e);
        }
    }

    /**
     * Creates a dispatch offer wave for a booking.
     */
    private void createOfferWave(String bookingId, int wave) throws ExecutionException, InterruptedException {
        PlatformConfig cfg = configService.getConfig();
        int parallel = Math.min(cfg.getParallelOffers().intValue(), 5);
        long offerTtlSec = cfg.getOfferTimeoutSec();

        BookingDoc booking = firestore.collection(BOOKINGS_COLLECTION).document(bookingId)
                .get().get().toObject(BookingDoc.class);
        if (booking == null) {
            return;
        }

        List<ProviderDoc> eligible = findEligibleProviders(booking);
        List<ProviderDoc> ranked = rankProviders(eligible, booking);

        Set<String> alreadyOffered = booking.getOfferedProviderIds() != null
                ? new HashSet<>(booking.getOfferedProviderIds()) : new HashSet<>();
        Set<String> rejected = booking.getRejectedProviderIds() != null
                ? new HashSet<>(booking.getRejectedProviderIds()) : new HashSet<>();

        List<ProviderDoc> toOffer = ranked.stream()
                .filter(p -> !alreadyOffered.contains(p.getId()))
                .filter(p -> !rejected.contains(p.getId()))
                .limit(parallel)
                .collect(Collectors.toList());

        if (toOffer.isEmpty()) {
            bookingStateMachine.transition(
                    bookingId,
                    BookingStatus.DISPATCHING,
                    BookingStatus.NO_PROVIDER_FOUND,
                    "SYSTEM",
                    Map.of("reason", "no eligible providers"),
                    null);
            return;
        }

        firestore.runTransaction(tx -> {
            DocumentReference bookingRef = firestore.collection(BOOKINGS_COLLECTION).document(bookingId);
            BookingDoc bd = tx.get(bookingRef).get().toObject(BookingDoc.class);
            if (bd == null) return null;
            List<String> offered = bd.getOfferedProviderIds() != null
                    ? new ArrayList<>(bd.getOfferedProviderIds()) : new ArrayList<>();
            for (ProviderDoc p : toOffer) {
                String offerId = firestore.collection(OFFERS_COLLECTION).document().getId();
                DispatchOffer offer = DispatchOffer.builder()
                        .id(offerId)
                        .bookingId(bookingId)
                        .providerId(p.getId())
                        .status(OFFER_PENDING)
                        .distanceKm(computeDistanceKm(p, bd))
                        .estimatedEarningsPaise(estimateEarnings(p, bd))
                        .wave(wave)
                        .createdAt(new Date())
                        .expiresAt(Date.from(Instant.now().plusSeconds(offerTtlSec)))
                        .build();
                tx.set(firestore.collection(OFFERS_COLLECTION).document(offerId), offer);
                offered.add(p.getId());
            }
            bd.setOfferedProviderIds(offered);
            tx.set(bookingRef, bd);
            return null;
        }).get();
    }

    private double computeDistanceKm(ProviderDoc p, BookingDoc booking) {
        if (booking.getLatitude() == null || booking.getLongitude() == null
                || p.getLatitude() == null || p.getLongitude() == null) {
            return Double.MAX_VALUE;
        }
        return GeoUtils.haversineDistanceKm(
                booking.getLatitude(), booking.getLongitude(),
                p.getLatitude(), p.getLongitude());
    }

    /** Rank providers by distance ascending. */
    private List<ProviderDoc> rankProviders(List<ProviderDoc> providers, BookingDoc booking) {
        return providers.stream()
                .sorted(Comparator.comparingDouble(p -> computeDistanceKm(p, booking)))
                .collect(Collectors.toList());
    }

    /** Find providers that satisfy eligibility criteria. */
    private List<ProviderDoc> findEligibleProviders(BookingDoc booking) throws ExecutionException, InterruptedException {
        PlatformConfig cfg = configService.getConfig();
        int parallel = Math.min(cfg.getParallelOffers().intValue(), 5);
        int queryLimit = parallel * 5;
        Set<String> rejected = booking.getRejectedProviderIds() != null
                ? new HashSet<>(booking.getRejectedProviderIds()) : new HashSet<>();
        long now = System.currentTimeMillis();
        Query q = firestore.collection(PROVIDERS_COLLECTION)
                .whereEqualTo("verificationStatus", "VERIFIED")
                .whereEqualTo("available", true)
                .limit(queryLimit);
        List<ProviderDoc> all = new ArrayList<>();
        for (var doc : q.get().get().getDocuments()) {
            ProviderDoc p = doc.toObject(ProviderDoc.class);
            if (p == null) continue;
            p.setId(doc.getId());
            if (p.getLastSeenAt() != null && (now - p.getLastSeenAt()) > 120_000) continue;
            if (rejected.contains(p.getId())) continue;
            if (providerStatsService.isSuspended(p.getId())) continue;
            all.add(p);
        }
        return all;
    }

    private long estimateEarnings(ProviderDoc provider, BookingDoc booking) {
        return booking.getAmount() != null ? booking.getAmount() : 0L;
    }

    /**
     * Provider accepts an offer.
     * Returns true if this provider became the winner, false if the offer was already taken.
     */
    public boolean acceptOffer(String offerId, String providerUid) {
        boolean allowed = rateLimiterService.tryConsume("acceptOffer:" + providerUid, 10, java.time.Duration.ofMinutes(1));
        if (!allowed) {
            throw new BadRequestException("Rate limit exceeded for accepting offers");
        }
        try {
            return firestore.runTransaction(tx -> {
                DocumentReference offerRef = firestore.collection(OFFERS_COLLECTION).document(offerId);
                DispatchOffer offer = tx.get(offerRef).get().toObject(DispatchOffer.class);
                if (offer == null) throw new ResourceNotFoundException("Offer not found");
                if (!offer.getProviderId().equals(providerUid)) throw new ForbiddenException("Not your offer");
                if (!OFFER_PENDING.equalsIgnoreCase(offer.getStatus())) {
                    return false;
                }
                DocumentReference bookingRef = firestore.collection(BOOKINGS_COLLECTION).document(offer.getBookingId());
                BookingDoc booking = tx.get(bookingRef).get().toObject(BookingDoc.class);
                if (booking == null) throw new ResourceNotFoundException("Booking not found");
                if (!BookingStatus.DISPATCHING.name().equalsIgnoreCase(booking.getStatus())) {
                    return false;
                }
                booking.setStatus(BookingStatus.ACCEPTED.name());
                booking.setProviderId(providerUid);
                tx.set(bookingRef, booking);

                offer.setStatus(BookingStatus.ACCEPTED.name());
                tx.set(offerRef, offer);

                Query sibling = firestore.collection(OFFERS_COLLECTION)
                        .whereEqualTo("bookingId", offer.getBookingId())
                        .whereNotEqualTo("id", offerId);
                for (var doc : tx.get(sibling).get().getDocuments()) {
                    DispatchOffer o = doc.toObject(DispatchOffer.class);
                    if (o != null && OFFER_PENDING.equalsIgnoreCase(o.getStatus())) {
                        o.setStatus(BookingStatus.CANCELLED.name());
                        tx.set(firestore.collection(OFFERS_COLLECTION).document(o.getId()), o);
                    }
                }
                providerStatsService.recordAccepted(providerUid);
                return true;
            }).get();
        } catch (Exception e) {
            log.error("Error accepting offer {}: {}", offerId, e.getMessage());
            throw new RuntimeException("Error accepting offer: " + e.getMessage(), e);
        }
    }

    /** Provider rejects an offer – marks REJECTED and attempts to top-up. */
    public void rejectOffer(String offerId, String providerUid, String reason) {
        try {
            firestore.runTransaction(tx -> {
                DocumentReference offerRef = firestore.collection(OFFERS_COLLECTION).document(offerId);
                DispatchOffer offer = tx.get(offerRef).get().toObject(DispatchOffer.class);
                if (offer == null) throw new ResourceNotFoundException("Offer not found");
                if (!offer.getProviderId().equals(providerUid)) throw new ForbiddenException("Not your offer");
                if (!OFFER_PENDING.equalsIgnoreCase(offer.getStatus())) {
                    return null;
                }
                offer.setStatus(BookingStatus.REJECTED.name());
                tx.set(offerRef, offer);

                DocumentReference bookingRef = firestore.collection(BOOKINGS_COLLECTION).document(offer.getBookingId());
                BookingDoc booking = tx.get(bookingRef).get().toObject(BookingDoc.class);
                if (booking != null) {
                    List<String> rej = booking.getRejectedProviderIds() != null
                            ? new ArrayList<>(booking.getRejectedProviderIds()) : new ArrayList<>();
                    rej.add(providerUid);
                    booking.setRejectedProviderIds(rej);
                    tx.set(bookingRef, booking);
                }
                return null;
            }).get();
            topUpOffers(offerId);
        } catch (Exception e) {
            log.error("Error rejecting offer {}: {}", offerId, e.getMessage());
            throw new RuntimeException("Error rejecting offer: " + e.getMessage(), e);
        }
    }

    /** Top-up offers when an existing one is rejected or expired. */
    private void topUpOffers(String referenceOfferId) {
        try {
            DocumentReference offerRef = firestore.collection(OFFERS_COLLECTION).document(referenceOfferId);
            DispatchOffer refOffer = offerRef.get().get().toObject(DispatchOffer.class);
            if (refOffer == null) return;
            String bookingId = refOffer.getBookingId();
            int currentWave = refOffer.getWave() != null ? refOffer.getWave() : 1;
            createOfferWave(bookingId, currentWave + 1);
        } catch (Exception e) {
            log.error("Error topping up offers for referenceOfferId={}: {}", referenceOfferId, e.getMessage());
        }
    }

    /**
     * Sweeper that runs every 5 seconds (lease-protected) to expire pending offers and enforce max dispatch time.
     */
    @Scheduled(fixedDelayString = "5000")
    public void sweepExpiredOffers() {
        String leaseName = "dispatch_offer_sweeper";
        long leaseTtlMs = 10_000;
        if (!lockHelper.acquire(leaseName, leaseTtlMs)) {
            return;
        }
        try {
            long now = System.currentTimeMillis();
            Query expiring = firestore.collection(OFFERS_COLLECTION)
                    .whereEqualTo("status", OFFER_PENDING)
                    .whereLessThanOrEqualTo("expiresAt", new Date(now));
            for (var doc : expiring.get().get().getDocuments()) {
                firestore.runTransaction(tx -> {
                    DispatchOffer o = tx.get(doc.getReference()).get().toObject(DispatchOffer.class);
                    if (o != null && OFFER_PENDING.equalsIgnoreCase(o.getStatus())) {
                        o.setStatus(BookingStatus.EXPIRED.name());
                        tx.set(doc.getReference(), o);
                    }
                    return null;
                }).get();
                topUpOffers(doc.getId());
            }

            PlatformConfig cfg = configService.getConfig();
            long maxDispatchMs = cfg.getMaxDispatchSeconds() * 1000;
            Query dispatching = firestore.collection(BOOKINGS_COLLECTION)
                    .whereEqualTo("status", BookingStatus.DISPATCHING.name());
            for (var bdoc : dispatching.get().get().getDocuments()) {
                BookingDoc b = bdoc.toObject(BookingDoc.class);
                if (b.getCreatedAt() != null && (now - b.getCreatedAt().getTime()) > maxDispatchMs) {
                    bookingStateMachine.transition(
                            b.getId(),
                            BookingStatus.DISPATCHING,
                            BookingStatus.NO_PROVIDER_FOUND,
                            "SYSTEM",
                            Map.of("reason", "dispatch timeout"),
                            null);
                }
            }
        } catch (Exception e) {
            log.error("Error in sweepExpiredOffers: {}", e.getMessage());
        } finally {
            lockHelper.release(leaseName);
        }
    }
}
