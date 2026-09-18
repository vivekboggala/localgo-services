package com.localgo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String label; // Home, Office, Other

    private String fullAddress;

    private String city;

    private String state;

    private String pincode;

    private Double latitude;

    private Double longitude;

    @Builder.Default
    private Boolean isDefault = false;
}
