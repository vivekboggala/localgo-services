package com.localgo.service;

import com.localgo.dto.response.ServiceResponse;
import com.localgo.entity.ServiceEntity;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceCategoryService {

    private final ServiceRepository serviceRepository;

    @Transactional(readOnly = true)
    public List<ServiceResponse> getAllActiveServices() {
        return serviceRepository.findByActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ServiceResponse getServiceById(Long id) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service category not found with ID: " + id));
        return mapToResponse(service);
    }

    public ServiceResponse mapToResponse(ServiceEntity entity) {
        return ServiceResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .icon(entity.getIcon())
                .category(entity.getCategory())
                .defaultDurationMins(entity.getDefaultDurationMins())
                .active(entity.getActive())
                .build();
    }
}
