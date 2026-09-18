package com.localgo.service;

import com.localgo.dto.response.ProviderResponse;
import com.localgo.dto.response.ServiceResponse;
import com.localgo.entity.ProviderProfile;
import com.localgo.entity.ProviderServiceEntity;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.repository.ProviderProfileRepository;
import com.localgo.repository.ProviderServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProviderService {

    private final ProviderProfileRepository providerProfileRepository;
    private final ProviderServiceRepository providerServiceRepository;
    private final LocationService locationService;
    private final ServiceCategoryService serviceCategoryService;

    @Transactional(readOnly = true)
    public List<ProviderResponse> getNearbyProviders(
            double lat, double lng, double radius, Long serviceId,
            Double minRating, Double maxPrice, String available, String sortBy) {

        locationService.validateCoordinates(lat, lng, radius);

        List<ProviderProfile> profiles;
        if (serviceId != null) {
            profiles = providerProfileRepository.findNearbyProvidersByService(lat, lng, radius, serviceId);
        } else {
            profiles = providerProfileRepository.findNearbyProviders(lat, lng, radius);
        }

        List<ProviderResponse> responses = profiles.stream()
                .map(profile -> {
                    double distance = locationService.calculateHaversineDistanceKm(
                            lat, lng, profile.getLatitude(), profile.getLongitude()
                    );
                    return mapToProviderResponse(profile, distance);
                })
                .filter(p -> {
                    if (available != null && available.equalsIgnoreCase("true") && Boolean.FALSE.equals(p.getAvailable())) return false;
                    if (minRating != null && minRating > 0 && (p.getRating() == null || p.getRating() < minRating)) return false;
                    if (maxPrice != null && maxPrice > 0 && p.getStartingPrice() != null && p.getStartingPrice().doubleValue() > maxPrice) return false;
                    return true;
                })
                .collect(Collectors.toList());

        // Server-side Sort execution
        if ("rating".equalsIgnoreCase(sortBy)) {
            responses.sort(java.util.Comparator.comparing(ProviderResponse::getRating, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder()))
                    .thenComparing(ProviderResponse::getDistanceKm, java.util.Comparator.nullsLast(Double::compareTo)));
        } else if ("price_asc".equalsIgnoreCase(sortBy)) {
            responses.sort(java.util.Comparator.comparing(ProviderResponse::getStartingPrice, java.util.Comparator.nullsLast(BigDecimal::compareTo))
                    .thenComparing(ProviderResponse::getDistanceKm, java.util.Comparator.nullsLast(Double::compareTo)));
        } else if ("price_desc".equalsIgnoreCase(sortBy)) {
            responses.sort(java.util.Comparator.comparing(ProviderResponse::getStartingPrice, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder()))
                    .thenComparing(ProviderResponse::getDistanceKm, java.util.Comparator.nullsLast(Double::compareTo)));
        } else {
            // default: distance
            responses.sort(java.util.Comparator.comparing(ProviderResponse::getDistanceKm, java.util.Comparator.nullsLast(Double::compareTo)));
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public ProviderResponse getProviderById(Long id, Double customerLat, Double customerLng) {
        ProviderProfile profile = providerProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found with ID: " + id));

        Double distance = null;
        if (customerLat != null && customerLng != null && profile.getLatitude() != null && profile.getLongitude() != null) {
            distance = locationService.calculateHaversineDistanceKm(customerLat, customerLng, profile.getLatitude(), profile.getLongitude());
        }

        return mapToProviderResponse(profile, distance);
    }

    public ProviderResponse mapToProviderResponse(ProviderProfile profile, Double distance) {
        List<ProviderServiceEntity> providerServices = providerServiceRepository.findByProviderIdAndActiveTrue(profile.getId());

        List<ServiceResponse> services = providerServices.stream()
                .map(ps -> serviceCategoryService.mapToResponse(ps.getService()))
                .collect(Collectors.toList());

        BigDecimal startingPrice = providerServices.stream()
                .map(ProviderServiceEntity::getStartingPrice)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.valueOf(250));

        return ProviderResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .name(profile.getUser().getName())
                .email(profile.getUser().getEmail())
                .phone(profile.getUser().getPhone())
                .profileImage(profile.getUser().getProfileImage())
                .description(profile.getDescription())
                .experienceYears(profile.getExperienceYears())
                .latitude(profile.getLatitude())
                .longitude(profile.getLongitude())
                .serviceArea(profile.getServiceArea())
                .serviceRadiusKm(profile.getServiceRadiusKm())
                .verificationStatus(profile.getVerificationStatus())
                .available(profile.getAvailable())
                .rating(profile.getRating())
                .completedJobs(profile.getCompletedJobs())
                .distanceKm(distance)
                .startingPrice(startingPrice)
                .services(services)
                .build();
    }
}
