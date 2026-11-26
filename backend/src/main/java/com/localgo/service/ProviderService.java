package com.localgo.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.localgo.dto.request.ProviderProfileUpdateRequest;
import com.localgo.dto.response.ProviderResponse;
import com.localgo.dto.response.ServiceResponse;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.model.ProviderDoc;
import com.localgo.model.ProviderServiceItem;
import com.localgo.util.GeoUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderService {

    private final Firestore firestore;

    /**
     * Problem 3a: Nearby-provider geo search
     * 1. Compute geohash query range(s) covering search radius.
     * 2. Query Firestore 'providers' collection on geohash range to fetch candidate providers.
     * 3. Compute exact Haversine distance in Java.
     * 4. Discard candidates outside search radius or provider's own serviceRadiusKm.
     * 5. Apply server-side filters (minRating, maxPrice, available, serviceId) and sort in Java.
     */
    public List<ProviderResponse> findNearbyProviders(
            Double latitude,
            Double longitude,
            Double radiusKm,
            String serviceId,
            Double minRating,
            Double maxPrice,
            Boolean availableOnly,
            String sortBy) {

        double searchRadius = (radiusKm != null && radiusKm > 0) ? radiusKm : 15.0;

        List<GeoUtils.GeoRange> ranges = GeoUtils.getGeoHashQueryRanges(latitude, longitude, searchRadius);
        Map<String, ProviderDoc> candidatesMap = new HashMap<>();

        List<ApiFuture<QuerySnapshot>> rangeFutures = new ArrayList<>(ranges.size());
        for (GeoUtils.GeoRange range : ranges) {
            rangeFutures.add(
                    firestore.collection("providers")
                            .whereGreaterThanOrEqualTo("geohash", range.getStartHash())
                            .whereLessThanOrEqualTo("geohash", range.getEndHash())
                            .get()
            );
        }

        for (int i = 0; i < ranges.size(); i++) {
            try {
                var querySnapshot = rangeFutures.get(i).get();
                for (var doc : querySnapshot.getDocuments()) {
                    ProviderDoc provider = doc.toObject(ProviderDoc.class);
                    if (provider != null) {
                        provider.setId(doc.getId());
                        candidatesMap.put(doc.getId(), provider);
                    }
                }
            } catch (Exception e) {
                GeoUtils.GeoRange range = ranges.get(i);
                log.error("Error executing geohash range query [{}-{}]: {}",
                        range.getStartHash(), range.getEndHash(), e.getMessage());
            }
        }

        List<ProviderResponse> results = new ArrayList<>();

        for (ProviderDoc candidate : candidatesMap.values()) {
            if (candidate.getLatitude() == null || candidate.getLongitude() == null) {
                continue;
            }

            // Exact Haversine distance
            double distance = GeoUtils.haversineDistanceKm(
                    latitude, longitude,
                    candidate.getLatitude(), candidate.getLongitude()
            );

            // Filter: must be within customer search radius
            if (distance > searchRadius) {
                continue;
            }

            // Filter: must be within provider's own service radius
            double providerRadius = candidate.getServiceRadiusKm() != null ? candidate.getServiceRadiusKm() : 10.0;
            if (distance > providerRadius) {
                continue;
            }

            // Filter: availability
            boolean effectivelyAvailable = isEffectivelyAvailable(candidate);
            if (Boolean.TRUE.equals(availableOnly) && !effectivelyAvailable) {
                continue;
            }
            if (Boolean.FALSE.equals(availableOnly) && effectivelyAvailable) {
                continue;
            }

            // Filter: min rating
            double rating = candidate.getRating() != null ? candidate.getRating() : 0.0;
            if (minRating != null && rating < minRating) {
                continue;
            }

            // Filter: serviceId
            ProviderServiceItem matchedService = null;
            if (candidate.getServices() != null) {
                for (ProviderServiceItem item : candidate.getServices()) {
                    if (serviceId == null || serviceId.equalsIgnoreCase(item.getServiceId())) {
                        if (matchedService == null || (item.getStartingPrice() != null &&
                                (matchedService.getStartingPrice() == null || item.getStartingPrice() < matchedService.getStartingPrice()))) {
                            matchedService = item;
                        }
                    }
                }
            }

            if (serviceId != null && matchedService == null) {
                // Requested specific service but provider doesn't offer it
                continue;
            }

            // Filter: maxPrice (convert startingPrice from integer paise to Rupees)
            BigDecimal startingPriceRupees = BigDecimal.ZERO;
            if (matchedService != null && matchedService.getStartingPrice() != null) {
                startingPriceRupees = BigDecimal.valueOf(matchedService.getStartingPrice())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }

            if (maxPrice != null && startingPriceRupees.doubleValue() > maxPrice) {
                continue;
            }

            ProviderResponse response = mapToResponse(candidate, distance);
            if (matchedService != null) {
                response.setStartingPrice(startingPriceRupees);
            }
            results.add(response);
        }

        // Apply sorting with active Online providers prioritized first
        Comparator<ProviderResponse> comparator;
        if ("rating".equalsIgnoreCase(sortBy)) {
            comparator = (a, b) -> Double.compare(
                    b.getRating() != null ? b.getRating() : 0.0,
                    a.getRating() != null ? a.getRating() : 0.0
            );
        } else if ("price".equalsIgnoreCase(sortBy) || "price_asc".equalsIgnoreCase(sortBy)) {
            comparator = (a, b) -> {
                BigDecimal pA = a.getStartingPrice() != null ? a.getStartingPrice() : BigDecimal.ZERO;
                BigDecimal pB = b.getStartingPrice() != null ? b.getStartingPrice() : BigDecimal.ZERO;
                return pA.compareTo(pB);
            };
        } else if ("price_desc".equalsIgnoreCase(sortBy)) {
            comparator = (a, b) -> {
                BigDecimal pA = a.getStartingPrice() != null ? a.getStartingPrice() : BigDecimal.ZERO;
                BigDecimal pB = b.getStartingPrice() != null ? b.getStartingPrice() : BigDecimal.ZERO;
                return pB.compareTo(pA);
            };
        } else {
            comparator = Comparator.comparingDouble(p -> p.getDistanceKm() != null ? p.getDistanceKm() : Double.MAX_VALUE);
        }

        results.sort(
                Comparator.comparing((ProviderResponse p) -> !Boolean.TRUE.equals(p.getAvailable()))
                        .thenComparing(comparator)
        );

        return results;
    }

    public ProviderResponse getProviderById(String id, Double userLat, Double userLon) {
        try {
            var docRef = firestore.collection("providers").document(id);
            var docSnap = docRef.get().get();
            if (!docSnap.exists()) {
                throw new ResourceNotFoundException("Provider not found with id: " + id);
            }
            ProviderDoc doc = docSnap.toObject(ProviderDoc.class);
            if (doc != null) {
                doc.setId(id);
                Integer actualCompleted = fetchCompletedJobsCount(id);
                if (actualCompleted != null && !actualCompleted.equals(doc.getCompletedJobs())) {
                    doc.setCompletedJobs(actualCompleted);
                    try {
                        docRef.update("completedJobs", actualCompleted);
                    } catch (Exception ignored) {}
                }
                Double distance = null;
                if (userLat != null && userLon != null && doc.getLatitude() != null && doc.getLongitude() != null) {
                    distance = GeoUtils.haversineDistanceKm(userLat, userLon, doc.getLatitude(), doc.getLongitude());
                }
                return mapToResponse(doc, distance);
            }
            throw new ResourceNotFoundException("Provider not found with id: " + id);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch provider {}: {}", id, e.getMessage());
            throw new RuntimeException("Error fetching provider: " + e.getMessage());
        }
    }

    private Integer fetchCompletedJobsCount(String providerId) {
        try {
            var bookingsCol = firestore.collection("bookings");
            if (bookingsCol == null) return null;
            var snap = bookingsCol
                    .whereEqualTo("providerId", providerId)
                    .whereEqualTo("status", "COMPLETED")
                    .get()
                    .get();
            return snap != null ? snap.size() : null;
        } catch (Exception e) {
            return null;
        }
    }

    public ProviderResponse updateProviderProfile(String providerId, ProviderProfileUpdateRequest request) {
        try {
            var docRef = firestore.collection("providers").document(providerId);
            var snap = docRef.get().get();
            if (!snap.exists()) {
                throw new ResourceNotFoundException("Provider profile not found for id: " + providerId);
            }
            ProviderDoc doc = snap.toObject(ProviderDoc.class);
            if (doc == null) {
                doc = new ProviderDoc();
            }
            doc.setId(providerId);

            if (request.getDescription() != null) doc.setDescription(request.getDescription());
            if (request.getExperienceYears() != null) doc.setExperienceYears(request.getExperienceYears());
            if (request.getServiceRadiusKm() != null) doc.setServiceRadiusKm(request.getServiceRadiusKm());
            if (request.getAvailable() != null) {
                doc.setAvailable(request.getAvailable());
                doc.setManualOffline(!request.getAvailable());
                doc.setLastSeenAt(System.currentTimeMillis());
            }

            if (request.getLatitude() != null && request.getLongitude() != null) {
                doc.setLatitude(request.getLatitude());
                doc.setLongitude(request.getLongitude());
                doc.setGeohash(GeoUtils.encodeGeohash(request.getLatitude(), request.getLongitude()));
            }

            docRef.set(doc).get();
            return mapToResponse(doc, null);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating provider profile {}: {}", providerId, e.getMessage());
            throw new RuntimeException("Failed to update provider profile: " + e.getMessage());
        }
    }

    public static final long PRESENCE_TIMEOUT_MS = 120_000L;

    /**
     * Strict Uber/Rapido-style availability: only Online when logged in on duty with a fresh heartbeat.
     */
    public boolean isEffectivelyAvailable(ProviderDoc doc) {
        if (doc == null || Boolean.TRUE.equals(doc.getManualOffline()) || !Boolean.TRUE.equals(doc.getAvailable())) {
            return false;
        }
        return doc.getLastSeenAt() != null && (System.currentTimeMillis() - doc.getLastSeenAt()) <= PRESENCE_TIMEOUT_MS;
    }

    public ProviderResponse mapToResponse(ProviderDoc doc, Double distanceKm) {
        List<ServiceResponse> serviceResponses = new ArrayList<>();
        BigDecimal lowestPrice = null;

        if (doc.getServices() != null) {
            for (ProviderServiceItem item : doc.getServices()) {
                BigDecimal inRupees = item.getStartingPrice() != null
                        ? BigDecimal.valueOf(item.getStartingPrice()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;

                if (lowestPrice == null || inRupees.compareTo(lowestPrice) < 0) {
                    lowestPrice = inRupees;
                }

                serviceResponses.add(ServiceResponse.builder()
                        .id(item.getServiceId())
                        .name(item.getServiceName())
                        .active(true)
                        .build());
            }
        }

        double roundedDistance = distanceKm != null
                ? BigDecimal.valueOf(distanceKm).setScale(2, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        return ProviderResponse.builder()
                .id(doc.getId())
                .userId(doc.getId())
                .name(doc.getName())
                .email(doc.getEmail())
                .phone(doc.getPhone())
                .description(doc.getDescription())
                .experienceYears(doc.getExperienceYears())
                .latitude(doc.getLatitude())
                .longitude(doc.getLongitude())
                .serviceRadiusKm(doc.getServiceRadiusKm())
                .verificationStatus(doc.getVerificationStatus() != null ? doc.getVerificationStatus() : "PENDING")
                .verificationNotes(doc.getVerificationNotes())
                .reviewedAt(doc.getReviewedAt())
                .available(isEffectivelyAvailable(doc))
                .manualOffline(Boolean.TRUE.equals(doc.getManualOffline()))
                .lastSeenAt(doc.getLastSeenAt())
                .rating(doc.getRating() != null ? BigDecimal.valueOf(doc.getRating()).setScale(1, RoundingMode.HALF_UP).doubleValue() : 0.0)
                .completedJobs(doc.getCompletedJobs() != null ? doc.getCompletedJobs() : 0)
                .distanceKm(distanceKm != null ? roundedDistance : null)
                .startingPrice(lowestPrice != null ? lowestPrice : BigDecimal.ZERO)
                .services(serviceResponses)
                .build();
    }
}
