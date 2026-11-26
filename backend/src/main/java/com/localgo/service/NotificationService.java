package com.localgo.service;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.localgo.dto.response.NotificationResponse;
import com.localgo.enums.NotificationType;
import com.localgo.model.NotificationDoc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final Firestore firestore;

    public void createNotification(String userId, NotificationType type, String title, String message, String bookingId) {
        try {
            var docRef = firestore.collection("notifications").document();
            NotificationDoc doc = NotificationDoc.builder()
                    .id(docRef.getId())
                    .userId(userId)
                    .bookingId(bookingId)
                    .title(title)
                    .message(message)
                    .type(type != null ? type.name() : NotificationType.BOOKING_CREATED.name())
                    .read(false)
                    .createdAt(new Date())
                    .build();
            docRef.set(doc).get();
        } catch (Exception e) {
            log.warn("Failed to create notification for user {}: {}", userId, e.getMessage());
        }
    }

    public Map<String, Object> getNotificationsPaginated(String userId, int limit, String cursor) {
        int pageSize = Math.max(1, Math.min(limit, 100));
        try {
            var notifCol = firestore.collection("notifications");
            Query query = notifCol
                    .whereEqualTo("userId", userId)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .limit(pageSize + 1);

            if (cursor != null && !cursor.isBlank()) {
                DocumentSnapshot cursorSnap = notifCol.document(cursor.trim()).get().get();
                if (cursorSnap.exists()) {
                    query = query.startAfter(cursorSnap);
                }
            }

            var snapshot = query.get().get();
            List<NotificationResponse> page = new ArrayList<>();
            boolean hasMore = false;
            String nextCursor = null;

            for (var doc : snapshot.getDocuments()) {
                NotificationDoc n = doc.toObject(NotificationDoc.class);
                if (n == null) continue;
                n.setId(doc.getId());
                if (page.size() < pageSize) {
                    page.add(mapToResponse(n));
                    nextCursor = doc.getId();
                } else {
                    hasMore = true;
                    break;
                }
            }

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("content", page);
            res.put("limit", pageSize);
            res.put("nextCursor", hasMore ? nextCursor : null);
            res.put("hasMore", hasMore);
            return res;
        } catch (Exception e) {
            log.warn("Paged query fallback for notifications ({}): {}", userId, e.getMessage());
            List<NotificationResponse> all = getNotificationsForUser(userId);
            int startIdx = 0;
            if (cursor != null && !cursor.isBlank()) {
                for (int i = 0; i < all.size(); i++) {
                    if (cursor.trim().equals(all.get(i).getId())) {
                        startIdx = i + 1;
                        break;
                    }
                }
            }
            int endIdx = Math.min(all.size(), startIdx + pageSize);
            List<NotificationResponse> slice = startIdx < endIdx ? all.subList(startIdx, endIdx) : List.of();
            boolean hasMore = endIdx < all.size();
            String nextCursor = hasMore && !slice.isEmpty() ? slice.get(slice.size() - 1).getId() : null;
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("content", slice);
            res.put("limit", pageSize);
            res.put("nextCursor", nextCursor);
            res.put("hasMore", hasMore);
            return res;
        }
    }

    public List<NotificationResponse> getNotificationsForUser(String userId) {
        try {
            var snapshot = firestore.collection("notifications")
                    .whereEqualTo("userId", userId)
                    .get().get();

            List<NotificationResponse> list = new ArrayList<>();
            for (var doc : snapshot.getDocuments()) {
                NotificationDoc n = doc.toObject(NotificationDoc.class);
                if (n != null) {
                    n.setId(doc.getId());
                    list.add(mapToResponse(n));
                }
            }
            list.sort((a, b) -> {
                if (a.getCreatedAt() == null) return 1;
                if (b.getCreatedAt() == null) return -1;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });
            return list;
        } catch (Exception e) {
            log.error("Failed to fetch notifications for {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    public long getUnreadCount(String userId) {
        try {
            var snapshot = firestore.collection("notifications")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("read", false)
                    .get().get();
            return snapshot.size();
        } catch (Exception e) {
            log.error("Failed to get unread count for {}: {}", userId, e.getMessage());
            return 0;
        }
    }

    public void markAsRead(String id, String userId) {
        try {
            var docRef = firestore.collection("notifications").document(id);
            var snap = docRef.get().get();
            if (snap.exists() && userId.equals(snap.getString("userId"))) {
                docRef.update("read", true).get();
            }
        } catch (Exception e) {
            log.error("Failed to mark notification {} as read: {}", id, e.getMessage());
        }
    }

    public void markAllAsRead(String userId) {
        try {
            var snapshot = firestore.collection("notifications")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("read", false)
                    .get().get();
            for (var doc : snapshot.getDocuments()) {
                doc.getReference().update("read", true);
            }
        } catch (Exception e) {
            log.error("Failed to mark all notifications as read for {}: {}", userId, e.getMessage());
        }
    }

    private NotificationResponse mapToResponse(NotificationDoc doc) {
        LocalDateTime createdLdt = null;
        if (doc.getCreatedAt() != null) {
            createdLdt = doc.getCreatedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        }

        NotificationType t = NotificationType.BOOKING_CREATED;
        if (doc.getType() != null) {
            try { t = NotificationType.valueOf(doc.getType()); } catch (Exception ignored) {}
        }

        boolean readFlag = Boolean.TRUE.equals(doc.getRead());
        return NotificationResponse.builder()
                .id(doc.getId())
                .bookingId(doc.getBookingId())
                .type(t)
                .title(doc.getTitle())
                .message(doc.getMessage())
                .read(readFlag)
                .createdAt(createdLdt)
                .build();
    }
}
