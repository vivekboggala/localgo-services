package com.localgo.model;

import com.google.cloud.firestore.annotation.Exclude;
import com.google.cloud.firestore.annotation.IgnoreExtraProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IgnoreExtraProperties
public class ProviderDoc {
    private String id; // matches Firebase Auth UID
    private String name;
    @Exclude
    private String email;
    @Exclude
    private String phone;
    private String description;
    private Integer experienceYears;
    private Double latitude;
    private Double longitude;
    private Double serviceRadiusKm;
    private String geohash;
    private String verificationStatus; // PENDING, VERIFIED, REJECTED
    private String verificationNotes;
    private String reviewedBy;
    private Long reviewedAt;
    private Double rating;
    private Integer completedJobs;
    private Boolean available;
    private Boolean manualOffline;
    private Long lastSeenAt;
    private List<ProviderServiceItem> services;
}
