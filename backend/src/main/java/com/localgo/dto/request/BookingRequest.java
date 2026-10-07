package com.localgo.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class BookingRequest {

    @NotBlank(message = "Provider ID is required")
    private String providerId;

    @NotBlank(message = "Service category ID is required")
    private String serviceId;

    @NotBlank(message = "Problem description is required")
    private String description;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    @NotBlank(message = "Full address is required")
    private String address;

    private String city;
    private String state;
    private String country;
    private String postalCode;

    @NotNull(message = "Scheduled date is required")
    @FutureOrPresent(message = "Scheduled date must be today or in the future")
    private LocalDate scheduledDate;

    @NotNull(message = "Scheduled time slot is required")
    private LocalTime scheduledTime;

    private Integer estimatedDurationMins;

    @NotBlank(message = "Payment method is required (CASH or UPI)")
    private String paymentMethod;

    private Double amount; // optional amount in Rupees
}
