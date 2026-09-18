package com.localgo.dto.request;

import com.localgo.enums.BookingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StatusUpdateRequest {
    @NotNull(message = "Target status is required")
    private BookingStatus status;

    private String cancellationReason;
}
