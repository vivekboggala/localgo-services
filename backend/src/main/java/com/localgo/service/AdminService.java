package com.localgo.service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.localgo.dto.response.BookingResponse;
import com.localgo.dto.response.ProviderResponse;
import com.localgo.dto.response.UserResponse;
import com.localgo.enums.BookingStatus;
import com.localgo.enums.NotificationType;
import com.localgo.enums.Role;
import com.localgo.exception.BadRequestException;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.model.BookingDoc;
import com.localgo.model.NotificationDoc;
import com.localgo.model.ProviderDoc;
import com.localgo.model.ReviewDoc;
import com.localgo.model.UserDoc;
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
public class AdminService {

    private final Firestore firestore;
    private final ProviderService providerService;
    private final BookingService bookingService;

    public Map<String, Object> getDashboardOverview() {
        try {
            var usersSnap = firestore.collection("users").get().get();
            var providersSnap = firestore.collection("providers").get().get();
            var bookingsSnap = firestore.collection("bookings").get().get();

            long totalCustomers = 0;
            for (var doc : usersSnap.getDocuments()) {
                String role = doc.getString("role");
                if (role == null || Role.CUSTOMER.name().equalsIgnoreCase(role)) {
                    totalCustomers++;
                }
            }

            long totalProviders = providersSnap.size();
            long pendingVerifications = 0;
            long verifiedProviders = 0;
            long rejectedProviders = 0;
            for (var doc : providersSnap.getDocuments()) {
                String vs = normalizeVerificationStatus(doc.getString("verificationStatus"));
                switch (vs) {
                    case "VERIFIED" -> verifiedProviders++;
                    case "REJECTED" -> rejectedProviders++;
                    default -> pendingVerifications++;
                }
            }

            long activeBookings = 0;
            long completedBookings = 0;
            long totalRevenuePaise = 0;
            Set<String> activeStatuses = Set.of(
                    BookingStatus.REQUESTED.name(),
                    BookingStatus.ACCEPTED.name(),
                    BookingStatus.ON_THE_WAY.name(),
                    BookingStatus.ARRIVED.name(),
                    BookingStatus.IN_PROGRESS.name()
            );

            for (var doc : bookingsSnap.getDocuments()) {
                String status = doc.getString("status");
                if (status != null && activeStatuses.contains(status)) {
                    activeBookings++;
                }
                if (BookingStatus.COMPLETED.name().equals(status)) {
                    completedBookings++;
                    if ("PAID".equalsIgnoreCase(doc.getString("paymentStatus"))) {
                        Long amount = doc.getLong("amount");
                        if (amount != null) {
                            totalRevenuePaise += amount;
                        }
                    }
                }
            }

            BigDecimal totalRealizedRevenue = BigDecimal.valueOf(totalRevenuePaise)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            Map<String, Object> overview = new LinkedHashMap<>();
            overview.put("totalCustomers", totalCustomers);
            overview.put("totalProviders", totalProviders);
            overview.put("pendingVerifications", pendingVerifications);
            overview.put("verifiedProviders", verifiedProviders);
            overview.put("rejectedProviders", rejectedProviders);
            overview.put("activeBookings", activeBookings);
            overview.put("completedBookings", completedBookings);
            overview.put("totalBookings", bookingsSnap.size());
            overview.put("totalRealizedRevenue", totalRealizedRevenue);
            return overview;
        } catch (Exception e) {
            log.error("Failed to load admin overview: {}", e.getMessage());
            throw new RuntimeException("Error loading admin overview: " + e.getMessage());
        }
    }

    public Map<String, Object> getProviders(String statusFilter, String search) {
        try {
            var snapshot = firestore.collection("providers").get().get();
            List<ProviderResponse> all = new ArrayList<>();
            Map<String, Long> counts = new LinkedHashMap<>();
            counts.put("ALL", 0L);
            counts.put("PENDING", 0L);
            counts.put("VERIFIED", 0L);
            counts.put("REJECTED", 0L);

            for (var doc : snapshot.getDocuments()) {
                ProviderDoc p = doc.toObject(ProviderDoc.class);
                if (p == null) continue;
                p.setId(doc.getId());
                ProviderResponse mapped = providerService.mapToResponse(p, null);
                String vs = normalizeVerificationStatus(mapped.getVerificationStatus());
                mapped.setVerificationStatus(vs);
                all.add(mapped);

                counts.put("ALL", counts.get("ALL") + 1L);
                counts.put(vs, counts.getOrDefault(vs, 0L) + 1L);
            }

            String normalizedFilter = statusFilter != null ? statusFilter.trim().toUpperCase() : "ALL";
            String q = search != null ? search.trim().toLowerCase() : "";

            List<ProviderResponse> filtered = all.stream()
                    .filter(p -> "ALL".equals(normalizedFilter) || normalizedFilter.isBlank()
                            || normalizedFilter.equalsIgnoreCase(p.getVerificationStatus()))
                    .filter(p -> q.isBlank() || matchesProviderQuery(p, q))
                    .sorted(Comparator
                            .comparingInt((ProviderResponse p) -> verificationPriority(p.getVerificationStatus()))
                            .thenComparing(p -> p.getName() != null ? p.getName().toLowerCase() : ""))
                    .toList();

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("content", filtered);
            result.put("totalElements", filtered.size());
            result.put("counts", counts);
            return result;
        } catch (Exception e) {
            log.error("Failed to list providers for admin: {}", e.getMessage());
            throw new RuntimeException("Error listing providers: " + e.getMessage());
        }
    }

    public ProviderResponse verifyProvider(String providerId, String rawStatus, String reason, String adminUid) {
        if (rawStatus == null || rawStatus.isBlank()) {
            throw new BadRequestException("Verification status is required (PENDING, VERIFIED, or REJECTED).");
        }
        String targetStatus = rawStatus.trim().toUpperCase();
        if (!Set.of("PENDING", "VERIFIED", "REJECTED").contains(targetStatus)) {
            throw new BadRequestException("Unsupported verification status: " + rawStatus);
        }
        if ("REJECTED".equals(targetStatus) && (reason == null || reason.isBlank())) {
            throw new BadRequestException("Please provide a rejection reason for the provider.");
        }

        try {
            DocumentReference docRef = firestore.collection("providers").document(providerId);
            var snap = docRef.get().get();
            if (!snap.exists()) {
                throw new ResourceNotFoundException("Provider not found: " + providerId);
            }

            String cleanNotes = reason != null ? reason.trim() : "";
            long now = System.currentTimeMillis();
            docRef.update(Map.of(
                    "verificationStatus", targetStatus,
                    "verificationNotes", cleanNotes,
                    "reviewedBy", adminUid != null ? adminUid : "admin",
                    "reviewedAt", now
            )).get();

            createVerificationNotification(providerId, targetStatus, cleanNotes);

            ProviderDoc updated = docRef.get().get().toObject(ProviderDoc.class);
            if (updated == null) {
                throw new ResourceNotFoundException("Provider not found after update: " + providerId);
            }
            updated.setId(providerId);
            return providerService.mapToResponse(updated, null);
        } catch (ResourceNotFoundException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to update verification status for provider {}: {}", providerId, e.getMessage());
            throw new RuntimeException("Error updating provider verification: " + e.getMessage());
        }
    }

    public Map<String, Object> getUsers() {
        try {
            var snapshot = firestore.collection("users").get().get();
            List<UserResponse> list = new ArrayList<>();
            for (var doc : snapshot.getDocuments()) {
                UserDoc u = doc.toObject(UserDoc.class);
                if (u == null) continue;
                Role role = parseRole(u.getRole());
                list.add(UserResponse.builder()
                        .id(doc.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .phone(u.getPhone())
                        .role(role)
                        .emailVerified(!Boolean.FALSE.equals(u.getEmailVerified()))
                        .build());
            }
            list.sort(Comparator.comparing(u -> u.getName() != null ? u.getName().toLowerCase() : ""));
            return Map.of("content", list, "totalElements", list.size());
        } catch (Exception e) {
            log.error("Failed to load users for admin: {}", e.getMessage());
            throw new RuntimeException("Error loading users: " + e.getMessage());
        }
    }

    public Map<String, Object> getBookings(String statusFilter) {
        try {
            var snapshot = firestore.collection("bookings").get().get();
            List<BookingResponse> list = new ArrayList<>();
            for (var doc : snapshot.getDocuments()) {
                BookingDoc b = doc.toObject(BookingDoc.class);
                if (b == null) continue;
                b.setId(doc.getId());
                if (statusFilter != null && !statusFilter.isBlank() && !"ALL".equalsIgnoreCase(statusFilter)
                        && !statusFilter.equalsIgnoreCase(b.getStatus())) {
                    continue;
                }
                list.add(bookingService.mapToResponse(b, null, false));
            }
            list.sort((a, b) -> {
                if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                if (a.getCreatedAt() == null) return 1;
                if (b.getCreatedAt() == null) return -1;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });
            return Map.of("content", list, "totalElements", list.size());
        } catch (Exception e) {
            log.error("Failed to load bookings for admin: {}", e.getMessage());
            throw new RuntimeException("Error loading bookings: " + e.getMessage());
        }
    }

    public Map<String, Object> getReviews() {
        try {
            var snapshot = firestore.collection("reviews").get().get();
            List<Map<String, Object>> list = new ArrayList<>();
            for (var doc : snapshot.getDocuments()) {
                ReviewDoc r = doc.toObject(ReviewDoc.class);
                if (r == null) continue;
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", doc.getId());
                item.put("bookingId", r.getBookingId());
                item.put("customerName", r.getCustomerName());
                item.put("providerId", r.getProviderId());
                item.put("rating", r.getRating());
                item.put("comment", r.getComment());
                item.put("hidden", Boolean.TRUE.equals(r.getHidden()));
                item.put("createdAt", r.getCreatedAt());
                list.add(item);
            }
            return Map.of("content", list, "totalElements", list.size());
        } catch (Exception e) {
            log.error("Failed to load reviews for admin: {}", e.getMessage());
            throw new RuntimeException("Error loading reviews: " + e.getMessage());
        }
    }

    public boolean toggleHideReview(String reviewId) {
        try {
            DocumentReference ref = firestore.collection("reviews").document(reviewId);
            var snap = ref.get().get();
            if (!snap.exists()) {
                throw new ResourceNotFoundException("Review not found: " + reviewId);
            }
            boolean current = Boolean.TRUE.equals(snap.getBoolean("hidden"));
            boolean next = !current;
            ref.update("hidden", next).get();
            return next;
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to toggle hidden flag for review {}: {}", reviewId, e.getMessage());
            throw new RuntimeException("Error updating review visibility: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> getAnalyticsTrends(int days) {
        int window = days > 0 ? Math.min(days, 90) : 7;
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(window - 1L);

        Map<LocalDate, Long> paiseByDate = new LinkedHashMap<>();
        Map<LocalDate, Integer> bookingsByDate = new LinkedHashMap<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            paiseByDate.put(d, 0L);
            bookingsByDate.put(d, 0);
        }

        try {
            var snapshot = firestore.collection("bookings")
                    .whereGreaterThanOrEqualTo("scheduledDate", start.toString())
                    .whereLessThanOrEqualTo("scheduledDate", end.toString())
                    .get().get();

            for (var doc : snapshot.getDocuments()) {
                String dateStr = doc.getString("scheduledDate");
                if (dateStr == null) continue;
                try {
                    LocalDate d = LocalDate.parse(dateStr);
                    if (!bookingsByDate.containsKey(d)) continue;
                    bookingsByDate.put(d, bookingsByDate.get(d) + 1);
                    if (BookingStatus.COMPLETED.name().equals(doc.getString("status"))
                            && "PAID".equalsIgnoreCase(doc.getString("paymentStatus"))) {
                        Long amount = doc.getLong("amount");
                        paiseByDate.put(d, paiseByDate.get(d) + (amount != null ? amount : 0L));
                    }
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            log.error("Failed to build admin trends: {}", e.getMessage());
            throw new RuntimeException("Error building analytics trends: " + e.getMessage());
        }

        List<Map<String, Object>> trend = new ArrayList<>();
        for (LocalDate d : bookingsByDate.keySet()) {
            BigDecimal rev = BigDecimal.valueOf(paiseByDate.get(d))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", d.toString());
            point.put("revenue", rev);
            point.put("bookings", bookingsByDate.get(d));
            trend.add(point);
        }
        return trend;
    }

    private void createVerificationNotification(String providerId, String status, String notes) {
        if (!"VERIFIED".equals(status) && !"REJECTED".equals(status)) return;
        try {
            DocumentReference ref = firestore.collection("notifications").document();
            boolean verified = "VERIFIED".equals(status);
            String title = verified ? "Profile Verified" : "Verification Update Required";
            String message = verified
                    ? "Your LocalGo provider profile has been approved and verified by an administrator."
                    : "Your provider verification was not approved: " + notes;
            NotificationDoc notification = NotificationDoc.builder()
                    .id(ref.getId())
                    .userId(providerId)
                    .title(title)
                    .message(message)
                    .type(verified ? NotificationType.PROVIDER_VERIFIED.name() : NotificationType.PROVIDER_REJECTED.name())
                    .read(false)
                    .createdAt(new Date())
                    .build();
            ref.set(notification).get();
        } catch (Exception e) {
            log.warn("Could not write verification notification for {}: {}", providerId, e.getMessage());
        }
    }

    private String normalizeVerificationStatus(String status) {
        if (status == null || status.isBlank()) return "PENDING";
        return status.trim().toUpperCase();
    }

    private int verificationPriority(String status) {
        if ("PENDING".equalsIgnoreCase(status)) return 0;
        if ("REJECTED".equalsIgnoreCase(status)) return 1;
        return 2;
    }

    private boolean matchesProviderQuery(ProviderResponse p, String q) {
        if (p.getName() != null && p.getName().toLowerCase().contains(q)) return true;
        if (p.getEmail() != null && p.getEmail().toLowerCase().contains(q)) return true;
        if (p.getPhone() != null && p.getPhone().toLowerCase().contains(q)) return true;
        if (p.getServices() != null) {
            return p.getServices().stream()
                    .anyMatch(s -> s.getName() != null && s.getName().toLowerCase().contains(q));
        }
        return false;
    }

    private Role parseRole(String raw) {
        if (raw == null) return Role.CUSTOMER;
        if (Role.ADMIN.name().equalsIgnoreCase(raw)) return Role.ADMIN;
        if (Role.PROVIDER.name().equalsIgnoreCase(raw)) return Role.PROVIDER;
        return Role.CUSTOMER;
    }
}
