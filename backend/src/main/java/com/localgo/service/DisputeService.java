package com.localgo.service;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.localgo.exception.BadRequestException;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.model.Dispute;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

/**
 * Service for handling disputes.
 * Creates a dispute, updates its status, and provides lookup.
 */
@Service
public class DisputeService {
    private final Firestore db;
    private final CollectionReference disputesCol;
    private final RateLimiterService rateLimiterService;

    public DisputeService(Firestore db, RateLimiterService rateLimiterService) {
        this.db = db;
        this.disputesCol = db.collection("disputes");
        this.rateLimiterService = rateLimiterService;
    }

    public Dispute raiseDispute(String bookingId, String raisedBy, String reason, String description)
            throws ExecutionException, InterruptedException {
        // Rate limit: max 5 disputes per booking per hour
        boolean allowed = rateLimiterService.tryConsume("dispute:" + bookingId, 5, Duration.ofHours(1));
        if (!allowed) {
            throw new BadRequestException("Rate limit exceeded for raising disputes");
        }
        Dispute d = new Dispute(bookingId, raisedBy, reason, description);
        disputesCol.document(d.getId()).set(d).get();
        return d;
    }

    public Dispute updateStatus(String disputeId, String newStatus)
            throws ExecutionException, InterruptedException {
        var docRef = disputesCol.document(disputeId);
        var snapshot = docRef.get().get();
        if (!snapshot.exists()) {
            throw new ResourceNotFoundException("Dispute not found: " + disputeId);
        }
        Dispute d = snapshot.toObject(Dispute.class);
        if (d == null) {
            throw new ResourceNotFoundException("Dispute data missing: " + disputeId);
        }
        d.setStatus(newStatus);
        docRef.set(d).get();
        return d;
    }

    public List<Dispute> getOpenDisputes() throws ExecutionException, InterruptedException {
        var query = disputesCol.whereEqualTo("status", "OPEN").get().get();
        return query.getDocuments().stream()
                .map(doc -> doc.toObject(Dispute.class))
                .collect(Collectors.toList());
    }
}
