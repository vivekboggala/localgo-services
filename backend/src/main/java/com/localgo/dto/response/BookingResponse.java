package com.localgo.dto.response;

import com.localgo.enums.BookingStatus;
import com.localgo.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingResponse {
    private Long id;

    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;

    private Long providerId;
    private Long providerUserId;
    private String providerName;
    private String providerPhone;

    private Long serviceId;
    private String serviceName;
    private String serviceCategory;
    private String serviceIcon;

    private String description;
    private Double latitude;
    private Double longitude;
    private String address;

    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private Integer estimatedDurationMins;

    private BookingStatus status;
    private String cancelledBy;
    private String cancellationReason;

    private BigDecimal amount;
    private String paymentMethod;
    private PaymentStatus paymentStatus;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
