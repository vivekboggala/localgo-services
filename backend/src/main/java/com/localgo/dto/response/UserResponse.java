package com.localgo.dto.response;

import com.localgo.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private String id; // Firebase Auth UID
    private String name;
    private String email;
    private String phone;
    private Role role;
    private String profileImage;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private Double latitude;
    private Double longitude;
    private String providerProfileId;
    private Boolean emailVerified;
}
