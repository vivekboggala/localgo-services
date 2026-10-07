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
public class FavoriteDoc {
    private String id; // format: customerId_providerId
    private String customerId;
    private String providerId;
    private Date createdAt;
}
