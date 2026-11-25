package com.localgo.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProviderRegisterRequest {
    private String uid;

    @NotBlank(message = "Full name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String password;

    private String otpVerificationToken;

    @NotBlank(message = "Business/Service description is required")
    private String description;

    @NotNull(message = "Experience years is required")
    private Integer experienceYears;

    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private String serviceArea;

    private Double serviceRadiusKm = 10.0;

    @NotBlank(message = "Primary service category ID is required")
    private String primaryServiceId;

    @NotNull(message = "Starting price is required")
    private Double startingPrice; // in Rupees from UI
}
