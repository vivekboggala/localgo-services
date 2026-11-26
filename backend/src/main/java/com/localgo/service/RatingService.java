package com.localgo.service;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.localgo.model.Rating;
import java.util.concurrent.ExecutionException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for handling private ratings from provider to customer.
 */
public class RatingService {
    private final Firestore db;
    private final CollectionReference ratingsCol;

    public RatingService(Firestore db) {
        this.db = db;
        this.ratingsCol = db.collection("ratings");
    }

    public Rating submitRating(String bookingId, String providerId, String customerId, int rating, String comments) throws ExecutionException, InterruptedException {
        Rating r = new Rating(bookingId, providerId, customerId, rating, comments);
        ratingsCol.document(r.getId()).set(r).get();
        return r;
    }

    public List<Rating> getRatingsForProvider(String providerId) throws ExecutionException, InterruptedException {
        var query = ratingsCol.whereEqualTo("providerId", providerId).get().get();
        return query.getDocuments().stream()
                .map(doc -> doc.toObject(Rating.class))
                .collect(Collectors.toList());
    }
}
