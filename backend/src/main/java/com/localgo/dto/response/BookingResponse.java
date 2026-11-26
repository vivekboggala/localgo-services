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
    private String id;

    private String customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;

    private String providerId;
    private String providerUserId;
    private String providerName;
    private String providerPhone;
    private Double providerLatitude;
    private Double providerLongitude;
    private String providerServiceArea;
    private Double distanceKm;

    private String serviceId;
    private String serviceName;
    private String serviceCategory;
    private String serviceIcon;

    private String description;
    private Double latitude;
    private Double longitude;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;

    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private Integer estimatedDurationMins;

    private BookingStatus status;
    private String cancelledBy;
    private String cancellationReason;

    private BigDecimal amount; // in INR (converted from paise)
    private BigDecimal extraAmount; // extra charges in INR
    private BigDecimal totalAmount; // amount + extraAmount in INR
    private String workSummary;
    private String paymentMethod;
    private PaymentStatus paymentStatus;
    private String paymentUtr;

    private String startOtp;
    private String completionOtp;

    private LocalDateTime acceptedAt;
    private LocalDateTime onTheWayAt;
    private LocalDateTime arrivedAt;
    private LocalDateTime inProgressAt;
    private LocalDateTime completedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
