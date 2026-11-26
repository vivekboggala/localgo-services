package com.localgo.service;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.localgo.model.SosEvent;

/**
 * Service for handling SOS events raised during a job.
 */
public class SosService {
    private final Firestore db;
    private final CollectionReference sosCol;

    public SosService(Firestore db) {
        this.db = db;
        this.sosCol = db.collection("sos_events");
    }

    public SosEvent raiseEvent(String bookingId, String raisedBy, double latitude, double longitude) throws Exception {
        SosEvent e = new SosEvent(bookingId, raisedBy, latitude, longitude);
        sosCol.document(e.getId()).set(e).get();
        // Additional admin notification could be triggered here.
        return e;
    }

    public void updateStatus(String eventId, String newStatus) throws Exception {
        var docRef = sosCol.document(eventId);
        var snap = docRef.get().get();
        if (!snap.exists()) {
            throw new IllegalArgumentException("SOS event not found: " + eventId);
        }
        SosEvent e = snap.toObject(SosEvent.class);
        e.setStatus(newStatus);
        docRef.set(e).get();
    }
}
