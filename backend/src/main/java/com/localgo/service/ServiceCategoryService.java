package com.localgo.service;

import com.google.cloud.firestore.Firestore;
import com.localgo.dto.response.ServiceResponse;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.model.ServiceDoc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceCategoryService {

    private final Firestore firestore;

    private static final long CACHE_TTL_MS = 5 * 60 * 1000L;
    private volatile List<ServiceResponse> cachedServices = null;
    private volatile long cacheUpdatedAt = 0L;

    public List<ServiceResponse> getAllActiveServices() {
        long now = System.currentTimeMillis();
        if (cachedServices != null && (now - cacheUpdatedAt) < CACHE_TTL_MS) {
            return cachedServices;
        }
        try {
            var snapshot = firestore.collection("services").get().get();
            List<ServiceResponse> list = new ArrayList<>();
            for (var doc : snapshot.getDocuments()) {
                ServiceDoc s = doc.toObject(ServiceDoc.class);
                if (s.getId() == null) {
                    s.setId(doc.getId());
                }
                list.add(mapToResponse(s));
            }
            cachedServices = List.copyOf(list);
            cacheUpdatedAt = now;
            return cachedServices;
        } catch (Exception e) {
            if (cachedServices != null) {
                log.warn("Returning stale cached services after Firestore error: {}", e.getMessage());
                return cachedServices;
            }
            log.error("Failed to get active services from Firestore", e);
            throw new RuntimeException("Error fetching services: " + e.getMessage());
        }
    }

    public ServiceResponse getServiceById(String id) {
        try {
            var doc = firestore.collection("services").document(id).get().get();
            if (!doc.exists()) {
                throw new ResourceNotFoundException("Service not found with id: " + id);
            }
            ServiceDoc s = doc.toObject(ServiceDoc.class);
            if (s.getId() == null) {
                s.setId(doc.getId());
            }
            return mapToResponse(s);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to get service by id {}", id, e);
            throw new RuntimeException("Error fetching service: " + e.getMessage());
        }
    }

    private ServiceResponse mapToResponse(ServiceDoc s) {
        return ServiceResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .icon(s.getIcon())
                .category(s.getCategory())
                .defaultDurationMins(s.getDefaultDurationMins())
                .active(true)
                .build();
    }
}
