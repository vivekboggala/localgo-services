package com.localgo.repository;

import com.localgo.entity.ProviderServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProviderServiceRepository extends JpaRepository<ProviderServiceEntity, Long> {
    List<ProviderServiceEntity> findByProviderIdAndActiveTrue(Long providerId);
    List<ProviderServiceEntity> findByProviderId(Long providerId);
}
