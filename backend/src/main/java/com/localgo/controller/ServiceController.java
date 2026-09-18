package com.localgo.controller;

import com.localgo.dto.response.ApiResponse;
import com.localgo.dto.response.ServiceResponse;
import com.localgo.service.ServiceCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceCategoryService serviceCategoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceResponse>>> getAllActiveServices() {
        List<ServiceResponse> services = serviceCategoryService.getAllActiveServices();
        return ResponseEntity.ok(ApiResponse.success("Active services fetched", services));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceResponse>> getServiceById(@PathVariable Long id) {
        ServiceResponse service = serviceCategoryService.getServiceById(id);
        return ResponseEntity.ok(ApiResponse.success("Service details fetched", service));
    }
}
