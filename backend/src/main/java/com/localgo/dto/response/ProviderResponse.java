package com.localgo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProviderResponse {
    private String id;
    private String userId;
    private String name;
    private String email;
    private String phone;
    private String profileImage;
    private String description;
    private Integer experienceYears;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private Double latitude;
    private Double longitude;
    private String serviceArea;
    private Double serviceRadiusKm;
    private String verificationStatus;
    private String verificationNotes;
    private Long reviewedAt;
    private Boolean available;
    private Boolean manualOffline;
    private Long lastSeenAt;
    private Double rating;
    private Integer completedJobs;
    private Double distanceKm;
    private BigDecimal startingPrice; // in INR (converted from integer paise)
    private List<ServiceResponse> services;
}
