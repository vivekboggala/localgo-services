package com.localgo.repository;

import com.localgo.entity.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {
    List<ServiceEntity> findByActiveTrue();
    Optional<ServiceEntity> findByNameIgnoreCase(String name);
    Boolean existsByNameIgnoreCase(String name);
}
