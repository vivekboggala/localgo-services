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
public class ReviewDoc {
    private String id;
    private String bookingId;
    private String customerId;
    private String customerName;
    private String providerId;
    private Double rating;
    private String comment;
    private Date createdAt;
}
