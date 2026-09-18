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
public class ProviderDashboardResponse {
    private Long providerId;
    private String providerName;
    private VerificationStatus verificationStatus;
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
