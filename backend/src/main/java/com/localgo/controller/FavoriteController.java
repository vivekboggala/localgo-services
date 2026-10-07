package com.localgo.controller;

import com.localgo.dto.response.ApiResponse;
import com.localgo.dto.response.ProviderResponse;
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

    @PostMapping("/{providerId}")
    public ResponseEntity<ApiResponse<String>> addFavorite(
            @PathVariable String providerId,
            Authentication authentication) {
        favoriteService.addFavorite(authentication.getName(), providerId);
        return ResponseEntity.ok(ApiResponse.success("Provider added to favorites", "SUCCESS"));
    }

    @DeleteMapping("/{providerId}")
    public ResponseEntity<ApiResponse<String>> removeFavorite(
            @PathVariable String providerId,
            Authentication authentication) {
        favoriteService.removeFavorite(authentication.getName(), providerId);
        return ResponseEntity.ok(ApiResponse.success("Provider removed from favorites", "SUCCESS"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProviderResponse>>> getFavorites(Authentication authentication) {
        List<ProviderResponse> favorites = favoriteService.getFavoriteProviders(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Favorites retrieved", favorites));
    }

    @GetMapping("/{providerId}/check")
    public ResponseEntity<ApiResponse<Boolean>> checkFavorite(
            @PathVariable String providerId,
            Authentication authentication) {
        boolean isFav = favoriteService.isFavorite(authentication.getName(), providerId);
        return ResponseEntity.ok(ApiResponse.success("Favorite status checked", isFav));
    }
}
