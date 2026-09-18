package com.localgo.controller;

import com.localgo.dto.response.ApiResponse;
import com.localgo.dto.response.ProviderResponse;
import com.localgo.entity.User;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.repository.UserRepository;
import com.localgo.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @PostMapping("/{providerId}")
    public ResponseEntity<ApiResponse<String>> addFavorite(
            @PathVariable Long providerId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        favoriteService.addFavorite(user.getId(), providerId);
        return ResponseEntity.ok(ApiResponse.success("Provider added to favorites", "SUCCESS"));
    }

    @DeleteMapping("/{providerId}")
    public ResponseEntity<ApiResponse<String>> removeFavorite(
            @PathVariable Long providerId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        favoriteService.removeFavorite(user.getId(), providerId);
        return ResponseEntity.ok(ApiResponse.success("Provider removed from favorites", "SUCCESS"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProviderResponse>>> getFavorites(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        List<ProviderResponse> favorites = favoriteService.getFavoriteProviders(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Favorites retrieved", favorites));
    }

    @GetMapping("/{providerId}/check")
    public ResponseEntity<ApiResponse<Boolean>> checkFavorite(
            @PathVariable Long providerId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        boolean isFav = favoriteService.isFavorite(user.getId(), providerId);
        return ResponseEntity.ok(ApiResponse.success("Favorite status checked", isFav));
    }
}
