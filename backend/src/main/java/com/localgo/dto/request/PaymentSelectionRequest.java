package com.localgo.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaymentSelectionRequest {
    @NotBlank(message = "Payment method is required (CASH or UPI)")
    private String paymentMethod;

    private String utr;
}
