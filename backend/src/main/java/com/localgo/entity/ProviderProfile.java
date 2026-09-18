package com.localgo.entity;

import com.localgo.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "provider_profiles", indexes = {
    @Index(name = "idx_provider_lat_lng", columnList = "latitude, longitude"),
    @Index(name = "idx_provider_verification", columnList = "verificationStatus")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProviderProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer experienceYears;

    private Double latitude;

    private Double longitude;

    private String serviceArea;

    @Builder.Default
    private Double serviceRadiusKm = 10.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Builder.Default
    private Boolean available = true;

    @Builder.Default
    private Double rating = 0.0;

    @Builder.Default
    private Integer completedJobs = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
