package com.localgo.service;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.localgo.model.BookingDoc;
import com.localgo.enums.BookingStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Detects bookings that are stuck in DISPATCHING for longer than a configurable timeout.
 * Admins can view these via an API (not implemented here) or logs.
 */
@Slf4j
@Service
public class StuckBookingMonitorService {
    private final Firestore db;
    private final CollectionReference bookingsCol;
    private final long stuckTimeoutSeconds = 300; // 5 minutes; could be made configurable via PlatformConfig

    public StuckBookingMonitorService(Firestore db) {
        this.db = db;
        this.bookingsCol = db.collection("bookings");
    }

    @Scheduled(cron = "0 */5 * * * *") // every 5 minutes
    public void scanForStuckBookings() {
        try {
            var query = bookingsCol.whereEqualTo("status", BookingStatus.DISPATCHING.name()).get().get();
            List<BookingDoc> stuck = query.getDocuments().stream()
                    .map(doc -> doc.toObject(BookingDoc.class))
                    .filter(b -> b.getCreatedAt() != null &&
                            Instant.now().minusSeconds(stuckTimeoutSeconds).isAfter(b.getCreatedAt().toInstant()))
                    .collect(Collectors.toList());
            if (!stuck.isEmpty()) {
                log.warn("Stuck bookings detected: count={}", stuck.size());
                for (BookingDoc b : stuck) {
                    log.warn("Stuck bookingId={} createdAt={}", b.getId(), b.getCreatedAt());
                }
            }
        } catch (Exception e) {
            log.error("Error scanning for stuck bookings", e);
        }
    }
}
