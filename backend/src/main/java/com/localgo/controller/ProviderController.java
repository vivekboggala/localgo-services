package com.localgo.controller;

import com.localgo.dto.response.ApiResponse;
import com.localgo.dto.response.ProviderResponse;
import com.localgo.service.ProviderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/providers")
@RequiredArgsConstructor
public class ProviderController {

    private final ProviderService providerService;

    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<ProviderResponse>>> getNearbyProviders(
            @RequestParam("latitude") double latitude,
            @RequestParam("longitude") double longitude,
            @RequestParam(value = "radius", defaultValue = "10") double radius,
            @RequestParam(value = "serviceId", required = false) Long serviceId,
            @RequestParam(value = "minRating", required = false) Double minRating,
            @RequestParam(value = "maxPrice", required = false) Double maxPrice,
            @RequestParam(value = "available", required = false) String available,
            @RequestParam(value = "sortBy", required = false) String sortBy) {

        List<ProviderResponse> providers = providerService.getNearbyProviders(
                latitude, longitude, radius, serviceId, minRating, maxPrice, available, sortBy
        );
        return ResponseEntity.ok(ApiResponse.success("Nearby providers fetched", providers));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProviderResponse>> getProviderById(
            @PathVariable Long id,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude) {

        ProviderResponse provider = providerService.getProviderById(id, latitude, longitude);
        return ResponseEntity.ok(ApiResponse.success("Provider details fetched", provider));
    }
}
