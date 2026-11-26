package com.localgo.service;

import com.google.cloud.firestore.Firestore;
import com.localgo.dto.request.ProviderProfileUpdateRequest;
import com.localgo.dto.request.StatusUpdateRequest;
import com.localgo.dto.response.BookingResponse;
import com.localgo.dto.response.EarningsTrendResponse;
import com.localgo.dto.response.ProviderDashboardResponse;
import com.localgo.dto.response.ProviderResponse;
import com.localgo.enums.BookingStatus;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.model.BookingDoc;
import com.localgo.model.ProviderDoc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderDashboardService {

    private final Firestore firestore;
    private final BookingService bookingService;
    private final ProviderService providerService;

    public ProviderDashboardResponse getDashboardStats(String providerId) {
        try {
            var provSnap = firestore.collection("providers").document(providerId).get().get();
            if (!provSnap.exists()) {
                throw new ResourceNotFoundException("Provider not found: " + providerId);
            }
            ProviderDoc provider = provSnap.toObject(ProviderDoc.class);
            if (provider == null) {
                provider = new ProviderDoc();
            }

            // 1. Fetch pending requests
            var pendingSnap = firestore.collection("bookings")
                    .whereEqualTo("providerId", providerId)
                    .whereEqualTo("status", BookingStatus.REQUESTED.name())
                    .get().get();

            List<BookingResponse> pendingRequests = new ArrayList<>();
            for (var doc : pendingSnap.getDocuments()) {
                BookingDoc b = doc.toObject(BookingDoc.class);
                if (b != null) {
                    b.setId(doc.getId());
                    pendingRequests.add(bookingService.mapToResponse(b, null));
                }
            }

            // 2. Fetch active jobs
            var activeSnap = firestore.collection("bookings")
                    .whereEqualTo("providerId", providerId)
                    .whereIn("status", List.of("ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS"))
                    .get().get();

            List<BookingResponse> activeJobs = new ArrayList<>();
            for (var doc : activeSnap.getDocuments()) {
                BookingDoc b = doc.toObject(BookingDoc.class);
                if (b != null) {
                    b.setId(doc.getId());
                    activeJobs.add(bookingService.mapToResponse(b, null));
                }
            }

            // 3. Calculate total completed jobs and realized earnings in integer paise
            var completedSnap = firestore.collection("bookings")
                    .whereEqualTo("providerId", providerId)
                    .whereEqualTo("status", BookingStatus.COMPLETED.name())
                    .get().get();

            long totalPaise = 0L;
            for (var doc : completedSnap.getDocuments()) {
                if ("PAID".equalsIgnoreCase(doc.getString("paymentStatus"))) {
                    Long amt = doc.getLong("amount");
                    if (amt != null) {
                        totalPaise += amt;
                    }
                }
            }

            int completedCount = completedSnap.size();
            if (!Integer.valueOf(completedCount).equals(provider.getCompletedJobs())) {
                try {
                    firestore.collection("providers").document(providerId).update("completedJobs", completedCount);
                } catch (Exception ignored) {}
            }

            BigDecimal realizedEarnings = BigDecimal.valueOf(totalPaise)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            return ProviderDashboardResponse.builder()
                    .providerId(providerId)
                    .providerName(provider.getName())
                    .verificationStatus(provider.getVerificationStatus() != null ? provider.getVerificationStatus() : "PENDING")
                    .verificationNotes(provider.getVerificationNotes())
                    .available(providerService.isEffectivelyAvailable(provider))
                    .manualOffline(Boolean.TRUE.equals(provider.getManualOffline()))
                    .lastSeenAt(provider.getLastSeenAt())
                    .rating(provider.getRating() != null ? provider.getRating() : 0.0)
                    .completedJobs(completedCount)
                    .serviceRadiusKm(provider.getServiceRadiusKm())
                    .todayRequestsCount(pendingRequests.size())
                    .activeJobsCount(activeJobs.size())
                    .totalCompletedJobs(completedCount)
                    .totalRealizedEarnings(realizedEarnings)
                    .activeJobs(activeJobs)
                    .pendingRequests(pendingRequests)
                    .build();
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to build provider dashboard for {}: {}", providerId, e.getMessage());
            throw new RuntimeException("Error fetching dashboard: " + e.getMessage());
        }
    }

    public List<BookingResponse> getPendingRequests(String providerId) {
        try {
            var snapshot = firestore.collection("bookings")
                    .whereEqualTo("providerId", providerId)
                    .whereEqualTo("status", BookingStatus.REQUESTED.name())
                    .get().get();

            List<BookingResponse> list = new ArrayList<>();
            for (var doc : snapshot.getDocuments()) {
                BookingDoc b = doc.toObject(BookingDoc.class);
                if (b != null) {
                    b.setId(doc.getId());
                    list.add(bookingService.mapToResponse(b, null));
                }
            }
            return list;
        } catch (Exception e) {
            log.error("Failed to fetch pending requests for {}: {}", providerId, e.getMessage());
            throw new RuntimeException("Error fetching requests: " + e.getMessage());
        }
    }

    public List<BookingResponse> getProviderBookings(String providerId, BookingStatus status) {
        try {
            var query = firestore.collection("bookings").whereEqualTo("providerId", providerId);
            if (status != null) {
                query = query.whereEqualTo("status", status.name());
            }
            var snapshot = query.get().get();

            List<BookingResponse> list = new ArrayList<>();
            for (var doc : snapshot.getDocuments()) {
                BookingDoc b = doc.toObject(BookingDoc.class);
                if (b != null) {
                    b.setId(doc.getId());
                    list.add(bookingService.mapToResponse(b, null));
                }
            }
            list.sort((a, b) -> {
                if (a.getCreatedAt() == null) return 1;
                if (b.getCreatedAt() == null) return -1;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });
            return list;
        } catch (Exception e) {
            log.error("Failed to fetch bookings for {}: {}", providerId, e.getMessage());
            throw new RuntimeException("Error fetching bookings: " + e.getMessage());
        }
    }

    public BookingResponse updateBookingStatus(String bookingId, StatusUpdateRequest request, String providerId) {
        return bookingService.updateBookingStatus(bookingId, request, providerId);
    }

    public BigDecimal getProviderEarnings(String providerId) {
        try {
            var snapshot = firestore.collection("bookings")
                    .whereEqualTo("providerId", providerId)
                    .whereEqualTo("status", BookingStatus.COMPLETED.name())
                    .whereEqualTo("paymentStatus", "PAID")
                    .get().get();

            long totalPaise = 0L;
            for (var doc : snapshot.getDocuments()) {
                Long amt = doc.getLong("amount");
                if (amt != null) {
                    totalPaise += amt;
                }
            }
            return BigDecimal.valueOf(totalPaise).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            log.error("Failed to calculate earnings for {}: {}", providerId, e.getMessage());
            throw new RuntimeException("Error calculating earnings: " + e.getMessage());
        }
    }

    /**
     * Problem 3c: Earnings aggregation with continuous zero-filling.
     * 1. Query bookings where providerId == X, status == COMPLETED, paymentStatus == PAID within date range.
     * 2. Sum amounts in integer paise and count completed jobs grouped by date in Java memory.
     * 3. Continuous zero-fill: build a continuous date map for the requested range and fill in 0 for any day with no completed bookings.
     */
    public List<EarningsTrendResponse> getProviderEarningsTrend(String providerId, int days) {
        int window = days > 0 ? days : 7;
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(window - 1);

        // Continuous date map for zero-filling
        Map<LocalDate, Long> dailyPaiseMap = new LinkedHashMap<>();
        Map<LocalDate, Integer> dailyCountMap = new LinkedHashMap<>();

        for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
            dailyPaiseMap.put(d, 0L);
            dailyCountMap.put(d, 0);
        }

        try {
            var snapshot = firestore.collection("bookings")
                    .whereEqualTo("providerId", providerId)
                    .whereEqualTo("status", BookingStatus.COMPLETED.name())
                    .whereEqualTo("paymentStatus", "PAID")
                    .whereGreaterThanOrEqualTo("scheduledDate", startDate.toString())
                    .whereLessThanOrEqualTo("scheduledDate", endDate.toString())
                    .get().get();

            for (var doc : snapshot.getDocuments()) {
                String dateStr = doc.getString("scheduledDate");
                Long amountPaise = doc.getLong("amount");
                if (dateStr != null) {
                    try {
                        LocalDate d = LocalDate.parse(dateStr);
                        if (dailyPaiseMap.containsKey(d)) {
                            dailyPaiseMap.put(d, dailyPaiseMap.get(d) + (amountPaise != null ? amountPaise : 0L));
                            dailyCountMap.put(d, dailyCountMap.get(d) + 1);
                        }
                    } catch (Exception ignored) {}
                }
            }
        } catch (Exception e) {
            log.error("Failed to query earnings trend for provider {}: {}", providerId, e.getMessage());
            throw new RuntimeException("Error querying earnings trend: " + e.getMessage());
        }

        List<EarningsTrendResponse> trend = new ArrayList<>();
        for (Map.Entry<LocalDate, Long> entry : dailyPaiseMap.entrySet()) {
            LocalDate date = entry.getKey();
            Long paise = entry.getValue();
            int count = dailyCountMap.getOrDefault(date, 0);

            BigDecimal rupees = BigDecimal.valueOf(paise).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            trend.add(EarningsTrendResponse.builder()
                    .date(date)
                    .earnings(rupees)
                    .completedBookings(count)
                    .build());
        }

        return trend;
    }

    public boolean toggleAvailability(String providerId) {
        try {
            var snap = firestore.collection("providers").document(providerId).get().get();
            if (!snap.exists()) {
                throw new ResourceNotFoundException("Provider not found: " + providerId);
            }
            ProviderDoc provider = snap.toObject(ProviderDoc.class);
            boolean current = providerService.isEffectivelyAvailable(provider);
            return setAvailability(providerId, !current);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to toggle availability for {}: {}", providerId, e.getMessage());
            throw new RuntimeException("Error toggling availability: " + e.getMessage());
        }
    }

    public boolean setAvailability(String providerId, boolean next) {
        try {
            var docRef = firestore.collection("providers").document(providerId);
            var snap = docRef.get().get();
            if (!snap.exists()) {
                throw new ResourceNotFoundException("Provider not found: " + providerId);
            }
            long now = System.currentTimeMillis();
            docRef.update(Map.of(
                    "available", next,
                    "manualOffline", !next,
                    "lastSeenAt", now
            )).get();
            return next;
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to update availability for {}: {}", providerId, e.getMessage());
            throw new RuntimeException("Error updating availability: " + e.getMessage());
        }
    }

    /**
     * Records active Provider Studio presence or explicit offline sign-out without overriding a manual offline pause.
     */
    public boolean updatePresence(String providerId, boolean online, boolean forceOnline) {
        try {
            var docRef = firestore.collection("providers").document(providerId);
            var snap = docRef.get().get();
            if (!snap.exists()) {
                throw new ResourceNotFoundException("Provider not found: " + providerId);
            }
            long now = System.currentTimeMillis();
            if (!online) {
                docRef.update(Map.of(
                        "available", false,
                        "manualOffline", false,
                        "lastSeenAt", now
                )).get();
                return false;
            }
            Boolean manualOffline = snap.getBoolean("manualOffline");
            if (forceOnline || !Boolean.TRUE.equals(manualOffline)) {
                docRef.update(Map.of(
                        "available", true,
                        "manualOffline", false,
                        "lastSeenAt", now
                )).get();
                return true;
            }
            docRef.update("lastSeenAt", now).get();
            return false;
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to update presence for {}: {}", providerId, e.getMessage());
            throw new RuntimeException("Error updating presence: " + e.getMessage());
        }
    }

    public ProviderResponse getProviderProfile(String providerId) {
        return providerService.getProviderById(providerId, null, null);
    }

    public void updateProviderProfile(String providerId, ProviderProfileUpdateRequest request) {
        providerService.updateProviderProfile(providerId, request);
    }
}
