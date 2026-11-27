package com.localgo.dto.request;

import com.localgo.enums.BookingStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StatusUpdateRequest {
    @NotNull(message = "Target status is required")
    private BookingStatus status;

    private String cancellationReason;

    private String otp;

    @DecimalMin(value = "0.00", message = "Extra charges cannot be negative")
    private BigDecimal extraCharges;

    private String workSummary;
}
