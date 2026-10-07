package com.localgo.service;

import com.google.cloud.firestore.Firestore;
import com.localgo.dto.response.ProviderResponse;
import com.localgo.model.FavoriteDoc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriteService {

    private final Firestore firestore;
    private final ProviderService providerService;

    /**
     * Problem 3d: Favorites uniqueness using composite document ID pattern ({customerId}_{providerId}).
     * A set() operation on this deterministic document ID is naturally idempotent and duplicate-proof.
     */
    public void addFavorite(String customerId, String providerId) {
        String docId = customerId + "_" + providerId;
        FavoriteDoc favorite = FavoriteDoc.builder()
                .id(docId)
                .customerId(customerId)
                .providerId(providerId)
                .createdAt(new Date())
                .build();

        try {
            firestore.collection("favorites").document(docId).set(favorite).get();
            log.info("Saved favorite with composite doc ID: {}", docId);
        } catch (Exception e) {
            log.error("Failed to add favorite {}: {}", docId, e.getMessage());
            throw new RuntimeException("Error adding favorite: " + e.getMessage());
        }
    }

    public void removeFavorite(String customerId, String providerId) {
        String docId = customerId + "_" + providerId;
        try {
            firestore.collection("favorites").document(docId).delete().get();
            log.info("Deleted favorite with composite doc ID: {}", docId);
        } catch (Exception e) {
            log.error("Failed to remove favorite {}: {}", docId, e.getMessage());
            throw new RuntimeException("Error removing favorite: " + e.getMessage());
        }
    }

    public boolean isFavorite(String customerId, String providerId) {
        String docId = customerId + "_" + providerId;
        try {
            var docSnap = firestore.collection("favorites").document(docId).get().get();
            return docSnap.exists();
        } catch (Exception e) {
            log.error("Failed to check favorite {}: {}", docId, e.getMessage());
            return false;
        }
    }

    public List<ProviderResponse> getFavoriteProviders(String customerId) {
        try {
            var snapshot = firestore.collection("favorites")
                    .whereEqualTo("customerId", customerId)
                    .get()
                    .get();

            List<ProviderResponse> list = new ArrayList<>();
            for (var doc : snapshot.getDocuments()) {
                String providerId = doc.getString("providerId");
                if (providerId != null) {
                    try {
                        ProviderResponse provider = providerService.getProviderById(providerId, null, null);
                        list.add(provider);
                    } catch (Exception e) {
                        log.warn("Provider {} in favorite list not found: {}", providerId, e.getMessage());
                    }
                }
            }
            return list;
        } catch (Exception e) {
            log.error("Failed to list favorites for customer {}: {}", customerId, e.getMessage());
            throw new RuntimeException("Error listing favorites: " + e.getMessage());
        }
    }
}
