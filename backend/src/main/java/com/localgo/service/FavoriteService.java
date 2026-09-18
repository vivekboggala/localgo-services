package com.localgo.service;

import com.localgo.dto.response.ProviderResponse;
import com.localgo.entity.Favorite;
import com.localgo.entity.ProviderProfile;
import com.localgo.entity.User;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.repository.FavoriteRepository;
import com.localgo.repository.ProviderProfileRepository;
import com.localgo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ProviderService providerService;

    @Transactional
    public void addFavorite(Long customerId, Long providerId) {
        if (favoriteRepository.existsByCustomerIdAndProviderId(customerId, providerId)) {
            return; // Already favorited
        }

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        ProviderProfile provider = providerProfileRepository.findById(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found with ID: " + providerId));

        Favorite favorite = Favorite.builder()
                .customer(customer)
                .provider(provider)
                .build();

        favoriteRepository.save(favorite);
    }

    @Transactional
    public void removeFavorite(Long customerId, Long providerId) {
        favoriteRepository.deleteByCustomerIdAndProviderId(customerId, providerId);
    }

    @Transactional(readOnly = true)
    public boolean isFavorite(Long customerId, Long providerId) {
        return favoriteRepository.existsByCustomerIdAndProviderId(customerId, providerId);
    }

    @Transactional(readOnly = true)
    public List<ProviderResponse> getFavoriteProviders(Long customerId) {
        List<Favorite> favorites = favoriteRepository.findByCustomerId(customerId);
        return favorites.stream()
                .map(fav -> providerService.mapToProviderResponse(fav.getProvider(), null))
                .collect(Collectors.toList());
    }
}
