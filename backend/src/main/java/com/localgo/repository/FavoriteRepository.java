package com.localgo.repository;

import com.localgo.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    boolean existsByCustomerIdAndProviderId(Long customerId, Long providerId);

    Optional<Favorite> findByCustomerIdAndProviderId(Long customerId, Long providerId);

    void deleteByCustomerIdAndProviderId(Long customerId, Long providerId);

    List<Favorite> findByCustomerId(Long customerId);
}
