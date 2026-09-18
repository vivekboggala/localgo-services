package com.localgo.repository;

import com.localgo.entity.ProviderProfile;
import com.localgo.enums.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long> {

    Optional<ProviderProfile> findByUserId(Long userId);

    Page<ProviderProfile> findByVerificationStatus(VerificationStatus status, Pageable pageable);

    long countByVerificationStatus(VerificationStatus status);

    @Query(value = """
        SELECT pp.*,
          (6371 * ACOS(
            COS(RADIANS(:lat)) * COS(RADIANS(pp.latitude)) *
            COS(RADIANS(pp.longitude) - RADIANS(:lng)) +
            SIN(RADIANS(:lat)) * SIN(RADIANS(pp.latitude))
          )) AS distance_km
        FROM provider_profiles pp
        JOIN users u ON pp.user_id = u.id
        WHERE pp.verification_status = 'VERIFIED'
          AND pp.available = true
          AND pp.latitude BETWEEN :lat - (:radius / 111.0) AND :lat + (:radius / 111.0)
          AND pp.longitude BETWEEN :lng - (:radius / (111.0 * COS(RADIANS(:lat))))
                               AND :lng + (:radius / (111.0 * COS(RADIANS(:lat))))
        HAVING distance_km <= :radius
           AND distance_km <= pp.service_radius_km
        ORDER BY distance_km ASC
        """, nativeQuery = true)
    List<ProviderProfile> findNearbyProviders(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radius") double radius
    );

    @Query(value = """
        SELECT DISTINCT pp.*,
          (6371 * ACOS(
            COS(RADIANS(:lat)) * COS(RADIANS(pp.latitude)) *
            COS(RADIANS(pp.longitude) - RADIANS(:lng)) +
            SIN(RADIANS(:lat)) * SIN(RADIANS(pp.latitude))
          )) AS distance_km
        FROM provider_profiles pp
        JOIN provider_services ps ON ps.provider_id = pp.id
        WHERE pp.verification_status = 'VERIFIED'
          AND pp.available = true
          AND ps.service_id = :serviceId
          AND ps.active = true
          AND pp.latitude BETWEEN :lat - (:radius / 111.0) AND :lat + (:radius / 111.0)
          AND pp.longitude BETWEEN :lng - (:radius / (111.0 * COS(RADIANS(:lat))))
                               AND :lng + (:radius / (111.0 * COS(RADIANS(:lat))))
        HAVING distance_km <= :radius
           AND distance_km <= pp.service_radius_km
        ORDER BY distance_km ASC
        """, nativeQuery = true)
    List<ProviderProfile> findNearbyProvidersByService(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radius") double radius,
        @Param("serviceId") Long serviceId
    );

    @Query("""
        SELECT DATE(pp.createdAt), COUNT(pp)
        FROM ProviderProfile pp
        WHERE pp.createdAt >= :startDate
        GROUP BY DATE(pp.createdAt)
    """)
    List<Object[]> findDailyNewProviderCounts(@Param("startDate") java.time.LocalDateTime startDate);
}

