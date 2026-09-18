package com.localgo.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProviderRegisterRequest {
    @NotBlank(message = "Full name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Business/Service description is required")
    private String description;

    @NotNull(message = "Experience years is required")
    private Integer experienceYears;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    @NotBlank(message = "Service area name is required")
    private String serviceArea;

    private Double serviceRadiusKm = 10.0;

    @NotNull(message = "Primary service category ID is required")
    private Long primaryServiceId;

    @NotNull(message = "Starting price is required")
    private Double startingPrice;
}
