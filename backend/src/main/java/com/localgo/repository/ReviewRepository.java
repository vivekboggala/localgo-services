package com.localgo.repository;

import com.localgo.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByProviderIdAndHiddenFalse(Long providerId, Pageable pageable);
    Boolean existsByBookingId(Long bookingId);
    Optional<Review> findByBookingId(Long bookingId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.provider.id = :providerId AND r.hidden = false")
    Double calculateAverageRatingForProvider(@Param("providerId") Long providerId);
}
