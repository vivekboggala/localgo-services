package com.localgo.dto.response;

import com.localgo.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationResponse {
    private String id;
    private NotificationType type;
    private String title;
    private String message;
    private String bookingId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
