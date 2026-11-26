package com.localgo.service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldPath;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;

@Service
@Slf4j
public class AdminService {

    private static final long BREAKDOWN_CACHE_TTL_MS = 60_000L;

    private record CachedBreakdown(long fetchedAtMs, Map<String, Object> data) {}

    private final Firestore firestore;
    private final ProviderService providerService;
    private final BookingService bookingService;
    private final ReviewService reviewService;
    private final AtomicReference<CachedBreakdown> breakdownCache = new AtomicReference<>();

    public AdminService(Firestore firestore, ProviderService providerService, BookingService bookingService) {
        this(firestore, providerService, bookingService, null);
    }

    @Autowired
    public AdminService(Firestore firestore, ProviderService providerService, BookingService bookingService, ReviewService reviewService) {
        this.firestore = firestore;
        this.providerService = providerService;
        this.bookingService = bookingService;
        this.reviewService = reviewService;
    }

    public Map<String, Object> getDashboardOverview() {
        return getDashboardOverview(7);
    }

    public Map<String, Object> getDashboardOverview(int days) {
        int window = normalizeWindowDays(days);
        LocalDate end = LocalDate.now();
        LocalDate currentStart = end.minusDays(window - 1L);
        LocalDate previousEnd = currentStart.minusDays(1L);
        LocalDate previousStart = previousEnd.minusDays(window - 1L);
        ZoneId zone = ZoneId.systemDefault();

        try {
            var usersSnap = firestore.collection("users").get().get();
            var providersSnap = firestore.collection("providers").get().get();
            var bookingsSnap = firestore.collection("bookings").get().get();

            long totalCustomers = 0;
            long currentCustomers = 0;
            long previousCustomers = 0;
            long currentProvidersJoined = 0;
            long previousProvidersJoined = 0;

            for (var doc : usersSnap.getDocuments()) {
                String role = doc.getString("role");
                boolean isCustomer = role == null || Role.CUSTOMER.name().equalsIgnoreCase(role);
                boolean isProvider = Role.PROVIDER.name().equalsIgnoreCase(role);
                if (isCustomer) {
                    totalCustomers++;
                }

                Date createdAt = doc.getDate("createdAt");
                if (createdAt != null) {
                    LocalDate createdDate = createdAt.toInstant().atZone(zone).toLocalDate();
                    if (!createdDate.isBefore(currentStart) && !createdDate.isAfter(end)) {
                        if (isCustomer) currentCustomers++;
                        if (isProvider) currentProvidersJoined++;
                    } else if (!createdDate.isBefore(previousStart) && !createdDate.isAfter(previousEnd)) {
                        if (isCustomer) previousCustomers++;
                        if (isProvider) previousProvidersJoined++;
                    }
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

            long currentBookingsCount = 0;
            long previousBookingsCount = 0;
            long currentCompletedCount = 0;
            long previousCompletedCount = 0;
            long currentRevenuePaise = 0;
            long previousRevenuePaise = 0;

            Set<String> activeStatuses = Set.of(
                    BookingStatus.REQUESTED.name(),
                    BookingStatus.ACCEPTED.name(),
                    BookingStatus.ON_THE_WAY.name(),
                    BookingStatus.ARRIVED.name(),
                    BookingStatus.IN_PROGRESS.name()
            );

            for (var doc : bookingsSnap.getDocuments()) {
                String status = doc.getString("status");
                boolean isCompleted = BookingStatus.COMPLETED.name().equals(status);
                boolean isPaid = "PAID".equalsIgnoreCase(doc.getString("paymentStatus"));
                Long amount = doc.getLong("amount");
                long amt = amount != null ? amount : 0L;

                if (status != null && activeStatuses.contains(status)) {
                    activeBookings++;
                }
                if (isCompleted) {
                    completedBookings++;
                    if (isPaid) {
                        totalRevenuePaise += amt;
                    }
                }

                LocalDate bookingDate = resolveBookingDate(doc.getString("scheduledDate"), doc.getDate("createdAt"), zone);
                if (bookingDate != null) {
                    if (!bookingDate.isBefore(currentStart) && !bookingDate.isAfter(end)) {
                        currentBookingsCount++;
                        if (isCompleted) {
                            currentCompletedCount++;
                            if (isPaid) currentRevenuePaise += amt;
                        }
                    } else if (!bookingDate.isBefore(previousStart) && !bookingDate.isAfter(previousEnd)) {
                        previousBookingsCount++;
                        if (isCompleted) {
                            previousCompletedCount++;
                            if (isPaid) previousRevenuePaise += amt;
                        }
                    }
                }
            }

            BigDecimal totalRealizedRevenue = BigDecimal.valueOf(totalRevenuePaise)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal currentRevInr = BigDecimal.valueOf(currentRevenuePaise)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal previousRevInr = BigDecimal.valueOf(previousRevenuePaise)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            Map<String, Object> deltas = new LinkedHashMap<>();
            deltas.put("windowDays", window);
            deltas.put("revenue", buildDecimalDelta(currentRevInr, previousRevInr));
            deltas.put("bookings", buildCountDelta(currentBookingsCount, previousBookingsCount));
            deltas.put("completedBookings", buildCountDelta(currentCompletedCount, previousCompletedCount));
            deltas.put("newCustomers", buildCountDelta(currentCustomers, previousCustomers));
            deltas.put("newProviders", buildCountDelta(currentProvidersJoined, previousProvidersJoined));

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
            overview.put("deltas", deltas);
            return overview;
        } catch (Exception e) {
            log.error("Failed to load admin overview: {}", e.getMessage());
            throw new RuntimeException("Error loading admin overview: " + e.getMessage());
        }
    }

    public Map<String, Object> getProviders(String statusFilter, String search) {
        return getProviders(statusFilter, search, 20, null);
    }

    public Map<String, Object> getProviders(String statusFilter, String search, int limit, String cursor) {
        int pageSize = Math.max(1, Math.min(limit, 100));
        try {
            var providersCol = firestore.collection("providers");
            var snapshot = providersCol.get().get();
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
                ProviderResponse mapped = providerService.mapToResponseWithContact(p, null);
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
                            .thenComparing(p -> p.getName() != null ? p.getName().toLowerCase() : "")
                            .thenComparing(p -> p.getId() != null ? p.getId() : ""))
                    .toList();

            List<ProviderResponse> page = sliceByCursor(filtered, pageSize, cursor, ProviderResponse::getId);
            boolean hasMore = computeHasMore(filtered, page, pageSize, ProviderResponse::getId);
            String nextCursor = hasMore && !page.isEmpty() ? page.get(page.size() - 1).getId() : null;

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("content", page);
            result.put("totalElements", filtered.size());
            result.put("counts", counts);
            result.put("limit", pageSize);
            result.put("nextCursor", nextCursor);
            result.put("hasMore", hasMore);
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
            return providerService.mapToResponseWithContact(updated, null);
        } catch (ResourceNotFoundException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to update verification status for provider {}: {}", providerId, e.getMessage());
            throw new RuntimeException("Error updating provider verification: " + e.getMessage());
        }
    }

    public Map<String, Object> getUsers() {
        return getUsers(null, 20, null);
    }

    public Map<String, Object> getUsers(String roleFilter, int limit, String cursor) {
        int pageSize = Math.max(1, Math.min(limit, 100));
        try {
            var usersCol = firestore.collection("users");
            boolean unfiltered = roleFilter == null || roleFilter.isBlank() || "ALL".equalsIgnoreCase(roleFilter);
            Query query = unfiltered
                    ? usersCol.orderBy(FieldPath.documentId())
                    : usersCol.whereEqualTo("role", roleFilter.trim().toUpperCase()).orderBy(FieldPath.documentId());

            if (cursor != null && !cursor.isBlank()) {
                DocumentSnapshot cursorSnap = usersCol.document(cursor.trim()).get().get();
                if (cursorSnap.exists()) {
                    query = query.startAfter(cursorSnap);
                }
            }

            var snapshot = query.limit(pageSize + 1).get().get();
            List<UserResponse> list = new ArrayList<>();
            boolean hasMore = false;
            String nextCursor = null;

            for (var doc : snapshot.getDocuments()) {
                UserDoc u = doc.toObject(UserDoc.class);
                if (u == null) continue;
                if (list.size() < pageSize) {
                    Role role = parseRole(u.getRole());
                    list.add(UserResponse.builder()
                            .id(doc.getId())
                            .name(u.getName())
                            .email(u.getEmail())
                            .phone(u.getPhone())
                            .role(role)
                            .emailVerified(!Boolean.FALSE.equals(u.getEmailVerified()))
                            .build());
                    nextCursor = doc.getId();
                } else {
                    hasMore = true;
                    break;
                }
            }

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("content", list);
            res.put("totalElements", list.size());
            res.put("limit", pageSize);
            res.put("nextCursor", hasMore ? nextCursor : null);
            res.put("hasMore", hasMore);
            return res;
        } catch (Exception e) {
            log.error("Failed to load users for admin: {}", e.getMessage());
            throw new RuntimeException("Error loading users: " + e.getMessage());
        }
    }

    public Map<String, Object> getBookings(String statusFilter) {
        return getBookings(statusFilter, 20, null);
    }

    public Map<String, Object> getBookings(String statusFilter, int limit, String cursor) {
        int pageSize = Math.max(1, Math.min(limit, 100));
        try {
            var bookingsCol = firestore.collection("bookings");
            boolean unfiltered = statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter);
            Query query = unfiltered
                    ? bookingsCol.orderBy("createdAt", Query.Direction.DESCENDING)
                    : bookingsCol.whereEqualTo("status", statusFilter.trim().toUpperCase()).orderBy(FieldPath.documentId());

            if (cursor != null && !cursor.isBlank()) {
                DocumentSnapshot cursorSnap = bookingsCol.document(cursor.trim()).get().get();
                if (cursorSnap.exists()) {
                    query = query.startAfter(cursorSnap);
                }
            }

            var snapshot = query.limit(pageSize + 1).get().get();
            List<BookingResponse> list = new ArrayList<>();
            boolean hasMore = false;
            String nextCursor = null;

            for (var doc : snapshot.getDocuments()) {
                BookingDoc b = doc.toObject(BookingDoc.class);
                if (b == null) continue;
                b.setId(doc.getId());
                if (list.size() < pageSize) {
                    list.add(bookingService.mapToResponse(b, null, false));
                    nextCursor = doc.getId();
                } else {
                    hasMore = true;
                    break;
                }
            }

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("content", list);
            res.put("totalElements", list.size());
            res.put("limit", pageSize);
            res.put("nextCursor", hasMore ? nextCursor : null);
            res.put("hasMore", hasMore);
            return res;
        } catch (Exception e) {
            log.error("Failed to load bookings for admin: {}", e.getMessage());
            throw new RuntimeException("Error loading bookings: " + e.getMessage());
        }
    }

    public Map<String, Object> getReviews() {
        return getReviews(20, null);
    }

    public Map<String, Object> getReviews(int limit, String cursor) {
        int pageSize = Math.max(1, Math.min(limit, 100));
        try {
            var reviewsCol = firestore.collection("reviews");
            Query query = reviewsCol.orderBy("createdAt", Query.Direction.DESCENDING);
            if (cursor != null && !cursor.isBlank()) {
                DocumentSnapshot cursorSnap = reviewsCol.document(cursor.trim()).get().get();
                if (cursorSnap.exists()) {
                    query = query.startAfter(cursorSnap);
                }
            }

            var snapshot = query.limit(pageSize + 1).get().get();
            List<Map<String, Object>> list = new ArrayList<>();
            boolean hasMore = false;
            String nextCursor = null;

            for (var doc : snapshot.getDocuments()) {
                ReviewDoc r = doc.toObject(ReviewDoc.class);
                if (r == null) continue;
                if (list.size() < pageSize) {
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
                    nextCursor = doc.getId();
                } else {
                    hasMore = true;
                    break;
                }
            }

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("content", list);
            res.put("totalElements", list.size());
            res.put("limit", pageSize);
            res.put("nextCursor", hasMore ? nextCursor : null);
            res.put("hasMore", hasMore);
            return res;
        } catch (Exception e) {
            log.error("Failed to load reviews for admin: {}", e.getMessage());
            throw new RuntimeException("Error loading reviews: " + e.getMessage());
        }
    }

    private <T> List<T> sliceByCursor(List<T> items, int pageSize, String cursor, java.util.function.Function<T, String> idFn) {
        int startIdx = 0;
        if (cursor != null && !cursor.isBlank()) {
            for (int i = 0; i < items.size(); i++) {
                if (cursor.trim().equals(idFn.apply(items.get(i)))) {
                    startIdx = i + 1;
                    break;
                }
            }
        }
        int endIdx = Math.min(items.size(), startIdx + pageSize);
        return startIdx < endIdx ? items.subList(startIdx, endIdx) : List.of();
    }

    private <T> boolean computeHasMore(List<T> all, List<T> page, int pageSize, java.util.function.Function<T, String> idFn) {
        if (page.isEmpty() || page.size() < pageSize) return false;
        String lastId = idFn.apply(page.get(page.size() - 1));
        for (int i = 0; i < all.size(); i++) {
            if (Objects.equals(lastId, idFn.apply(all.get(i)))) {
                return i + 1 < all.size();
            }
        }
        return false;
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
            String providerId = snap.getString("providerId");
            if (reviewService != null && providerId != null) {
                reviewService.recalculateProviderRating(providerId);
            }
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

    public List<Map<String, Object>> getUsersTrend(int days) {
        int window = normalizeWindowDays(days);
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(window - 1L);
        ZoneId zone = ZoneId.systemDefault();

        Date startDate = Date.from(start.atStartOfDay(zone).toInstant());
        Date endExclusive = Date.from(end.plusDays(1L).atStartOfDay(zone).toInstant());

        Map<LocalDate, Integer> customersByDate = new LinkedHashMap<>();
        Map<LocalDate, Integer> providersByDate = new LinkedHashMap<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            customersByDate.put(d, 0);
            providersByDate.put(d, 0);
        }

        try {
            var snapshot = firestore.collection("users")
                    .whereGreaterThanOrEqualTo("createdAt", startDate)
                    .whereLessThan("createdAt", endExclusive)
                    .get().get();

            for (var doc : snapshot.getDocuments()) {
                Date createdAt = doc.getDate("createdAt");
                if (createdAt == null) continue;
                LocalDate d = createdAt.toInstant().atZone(zone).toLocalDate();
                if (!customersByDate.containsKey(d)) continue;
                String role = doc.getString("role");
                if (Role.PROVIDER.name().equalsIgnoreCase(role)) {
                    providersByDate.put(d, providersByDate.get(d) + 1);
                } else if (role == null || Role.CUSTOMER.name().equalsIgnoreCase(role)) {
                    customersByDate.put(d, customersByDate.get(d) + 1);
                }
            }
        } catch (Exception e) {
            log.error("Failed to build user growth trend: {}", e.getMessage());
            throw new RuntimeException("Error building user growth trend: " + e.getMessage());
        }

        List<Map<String, Object>> series = new ArrayList<>();
        for (LocalDate d : customersByDate.keySet()) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", d.toString());
            point.put("customers", customersByDate.get(d));
            point.put("providers", providersByDate.get(d));
            series.add(point);
        }
        return series;
    }

    public Map<String, Object> getBookingsBreakdown() {
        CachedBreakdown cached = breakdownCache.get();
        long now = System.currentTimeMillis();
        if (cached != null && (now - cached.fetchedAtMs()) < BREAKDOWN_CACHE_TTL_MS) {
            return cached.data();
        }

        try {
            var bookingsCol = firestore.collection("bookings");

            // 1. Server-side count() aggregation per BookingStatus (no full document download)
            List<Map<String, Object>> byStatus = new ArrayList<>();
            long totalFromStatus = 0L;
            for (BookingStatus status : BookingStatus.values()) {
                long count = executeCountQuery(bookingsCol.whereEqualTo("status", status.name()));
                totalFromStatus += count;
                if (count > 0) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("status", status.name());
                    row.put("label", status.name().replace('_', ' '));
                    row.put("count", count);
                    byStatus.add(row);
                }
            }

            // 2. Server-side count() aggregation per service catalog item, grouped also by category
            var servicesCol = firestore.collection("services");
            var serviceDocs = servicesCol != null ? servicesCol.limit(50).get().get().getDocuments() : List.<com.google.cloud.firestore.QueryDocumentSnapshot>of();

            List<Map<String, Object>> byService = new ArrayList<>();
            Map<String, Long> categoryTotals = new LinkedHashMap<>();
            for (var svcDoc : serviceDocs) {
                String serviceId = svcDoc.getId();
                String name = svcDoc.getString("name");
                String category = svcDoc.getString("category");
                String safeName = (name != null && !name.isBlank()) ? name : serviceId;
                String safeCategory = (category != null && !category.isBlank()) ? category : "General";

                long count = executeCountQuery(bookingsCol.whereEqualTo("serviceId", serviceId));
                if (count > 0) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("serviceId", serviceId);
                    row.put("name", safeName);
                    row.put("category", safeCategory);
                    row.put("count", count);
                    byService.add(row);
                    categoryTotals.merge(safeCategory, count, Long::sum);
                }
            }

            byService.sort((a, b) -> Long.compare(((Number) b.get("count")).longValue(), ((Number) a.get("count")).longValue()));

            List<Map<String, Object>> byCategory = categoryTotals.entrySet().stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .map(e -> {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("category", e.getKey());
                        row.put("count", e.getValue());
                        return row;
                    })
                    .toList();

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("byStatus", byStatus);
            payload.put("byService", byService);
            payload.put("byCategory", byCategory);
            payload.put("totalBookings", totalFromStatus);
            payload.put("cachedAt", now);

            breakdownCache.set(new CachedBreakdown(now, payload));
            return payload;
        } catch (Exception e) {
            log.error("Failed to build bookings breakdown: {}", e.getMessage());
            throw new RuntimeException("Error building bookings breakdown: " + e.getMessage());
        }
    }

    public void invalidateBreakdownCache() {
        breakdownCache.set(null);
    }

    private long executeCountQuery(Query query) throws Exception {
        if (query == null) return 0L;
        var agg = query.count();
        if (agg == null) return 0L;
        var snap = agg.get().get();
        return snap != null ? snap.getCount() : 0L;
    }

    private int normalizeWindowDays(int days) {
        if (days <= 0) return 7;
        return Math.min(days, 90);
    }

    private LocalDate resolveBookingDate(String scheduledDate, Date createdAt, ZoneId zone) {
        if (scheduledDate != null && !scheduledDate.isBlank()) {
            try {
                return LocalDate.parse(scheduledDate.trim());
            } catch (Exception ignored) {}
        }
        if (createdAt != null) {
            return createdAt.toInstant().atZone(zone).toLocalDate();
        }
        return null;
    }

    private Map<String, Object> buildCountDelta(long current, long previous) {
        int pct;
        if (previous == 0 && current == 0) {
            pct = 0;
        } else if (previous == 0) {
            pct = 100;
        } else {
            pct = (int) Math.round(((current - previous) * 100.0) / previous);
        }
        Map<String, Object> delta = new LinkedHashMap<>();
        delta.put("current", current);
        delta.put("previous", previous);
        delta.put("pct", pct);
        delta.put("positive", pct >= 0);
        return delta;
    }

    private Map<String, Object> buildDecimalDelta(BigDecimal current, BigDecimal previous) {
        int pct;
        if (previous.compareTo(BigDecimal.ZERO) == 0 && current.compareTo(BigDecimal.ZERO) == 0) {
            pct = 0;
        } else if (previous.compareTo(BigDecimal.ZERO) == 0) {
            pct = 100;
        } else {
            pct = current.subtract(previous)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(previous, 0, RoundingMode.HALF_UP)
                    .intValue();
        }
        Map<String, Object> delta = new LinkedHashMap<>();
        delta.put("current", current);
        delta.put("previous", previous);
        delta.put("pct", pct);
        delta.put("positive", pct >= 0);
        return delta;
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
