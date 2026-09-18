package com.localgo.dto.response;

import com.localgo.enums.VerificationStatus;
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
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String profileImage;
    private String description;
    private Integer experienceYears;
    private Double latitude;
    private Double longitude;
    private String serviceArea;
    private Double serviceRadiusKm;
    private VerificationStatus verificationStatus;
    private Boolean available;
    private Double rating;
    private Integer completedJobs;
    private Double distanceKm;
    private BigDecimal startingPrice;
    private List<ServiceResponse> services;
}
