package com.localgo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminTrendResponse {
    private LocalDate date;
    private BigDecimal revenue;
    private int bookingCount;
    private int newProvidersCount;
}
