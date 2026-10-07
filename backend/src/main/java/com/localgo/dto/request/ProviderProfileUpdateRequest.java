package com.localgo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProviderProfileUpdateRequest {
    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Experience years is required")
    private Integer experienceYears;

    @NotBlank(message = "Service area is required")
    private String serviceArea;

    @NotNull(message = "Service radius is required")
    private Double serviceRadiusKm;

    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;

    private Boolean available;
    private Double latitude;
    private Double longitude;
}
