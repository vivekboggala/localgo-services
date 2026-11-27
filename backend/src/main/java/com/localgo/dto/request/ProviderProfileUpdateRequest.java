package com.localgo.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProviderProfileUpdateRequest {
    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Experience years is required")
    @Min(value = 0, message = "Experience years cannot be negative")
    @Max(value = 80, message = "Experience years cannot exceed 80")
    private Integer experienceYears;

    @NotBlank(message = "Service area is required")
    private String serviceArea;

    @NotNull(message = "Service radius is required")
    @DecimalMin(value = "1.0", message = "Service radius must be at least 1 km")
    @DecimalMax(value = "100.0", message = "Service radius cannot exceed 100 km")
    private Double serviceRadiusKm;

    @DecimalMin(value = "0.0", message = "Starting price cannot be negative")
    private Double startingPrice;

    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;

    private Boolean available;

    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
    private Double longitude;
}
