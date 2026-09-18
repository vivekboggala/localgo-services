package com.localgo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminDashboardResponse {
    private long totalCustomers;
    private long totalProviders;
    private long pendingVerifications;
    private long activeBookings;
    private long completedBookings;
    private BigDecimal totalRealizedRevenue;
}
