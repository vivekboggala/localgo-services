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
public class ProviderDashboardResponse {
    private String providerId;
    private String providerName;
    private String verificationStatus;
    private Boolean available;
    private Double rating;
    private Integer completedJobs;
    private Double serviceRadiusKm;

    private long todayRequestsCount;
    private long activeJobsCount;
    private long totalCompletedJobs;
    private BigDecimal totalRealizedEarnings;

    private List<BookingResponse> activeJobs;
    private List<BookingResponse> pendingRequests;
}
