package com.localgo.model;

import com.google.cloud.firestore.annotation.IgnoreExtraProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IgnoreExtraProperties
public class NotificationDoc {
    private String id;
    private String userId;
    private String bookingId;
    private String title;
    private String message;
    private String type;
    private Boolean read;
    private Date createdAt;
}
