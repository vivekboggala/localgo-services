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

    public List<ServiceResponse> getAllActiveServices() {
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
            return list;
        } catch (Exception e) {
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
