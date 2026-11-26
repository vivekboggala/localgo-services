package com.localgo.service;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.localgo.model.Dispute;
import java.util.concurrent.ExecutionException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for handling disputes.
 * Creates a dispute, updates its status, and provides lookup.
 */
public class DisputeService {
    private final Firestore db;
    private final CollectionReference disputesCol;

    public DisputeService(Firestore db) {
        this.db = db;
        this.disputesCol = db.collection("disputes");
    }

    public Dispute raiseDispute(String bookingId, String raisedBy, String reason, String description) throws ExecutionException, InterruptedException {
        Dispute d = new Dispute(bookingId, raisedBy, reason, description);
        disputesCol.document(d.getId()).set(d).get();
        // TODO: freeze wallet earnings, notify admin, etc.
        return d;
    }

    public Dispute updateStatus(String disputeId, String newStatus) throws ExecutionException, InterruptedException {
        var docRef = disputesCol.document(disputeId);
        var snapshot = docRef.get().get();
        if (!snapshot.exists()) {
            throw new IllegalArgumentException("Dispute not found: " + disputeId);
        }
        Dispute d = snapshot.toObject(Dispute.class);
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
