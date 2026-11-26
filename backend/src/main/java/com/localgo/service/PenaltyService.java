package com.localgo.service;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.localgo.model.PenaltyLedgerEntry;
import java.util.concurrent.ExecutionException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for recording and retrieving penalty ledger entries.
 */
public class PenaltyService {
    private final Firestore db;
    private final CollectionReference penaltiesCol;

    public PenaltyService(Firestore db) {
        this.db = db;
        this.penaltiesCol = db.collection("penalty_ledger");
    }

    public PenaltyLedgerEntry recordPenalty(String providerId, String reason, int severity) throws ExecutionException, InterruptedException {
        PenaltyLedgerEntry entry = new PenaltyLedgerEntry(providerId, reason, severity);
        penaltiesCol.document(entry.getId()).set(entry).get();
        return entry;
    }

    public List<PenaltyLedgerEntry> getPenaltiesForProvider(String providerId) throws ExecutionException, InterruptedException {
        var query = penaltiesCol.whereEqualTo("providerId", providerId).get().get();
        return query.getDocuments().stream()
                .map(doc -> doc.toObject(PenaltyLedgerEntry.class))
                .collect(Collectors.toList());
    }
}
