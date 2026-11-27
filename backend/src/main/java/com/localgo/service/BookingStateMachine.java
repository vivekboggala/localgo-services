package com.localgo.service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;
import com.localgo.enums.BookingStatus;
import com.localgo.enums.Role;
import com.localgo.exception.BadRequestException;
import com.localgo.exception.ForbiddenException;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.model.BookingDoc;
import com.localgo.model.BookingEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Centralised state‑machine for booking lifecycle.
 * All status changes must go through {@link #transition(String, BookingStatus, BookingStatus, String, Map)}.
 * The method runs inside a Firestore transaction, validates guard conditions, updates the booking
 * document, appends an immutable event to bookings/{id}/events, and performs side‑effects supplied
 * via the {@code sideEffect} callback.
 */
@Service
@Slf4j
public class BookingStateMachine {

    private final Firestore firestore;

    @Autowired
    public BookingStateMachine(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Execute a state transition.
     *
     * @param bookingId   ID of the booking document.
     * @param from        Expected current status.
     * @param to          Desired next status.
     * @param actorId     UID of the actor performing the transition.
     * @param sideEffect  Optional side‑effect executed inside the same transaction after the
     *                    status has been validated and before the event is logged. May be {@code null}.
     * @return the updated {@link BookingDoc}.
     */
    public BookingDoc transition(String bookingId,
                                 BookingStatus from,
                                 BookingStatus to,
                                 String actorId,
                                 Map<String, Object> metadata,
                                 TransactionSideEffect sideEffect) {
        try {
            return firestore.runTransaction(tx -> {
                DocumentReference bookingRef = firestore.collection("bookings").document(bookingId);
                BookingDoc booking = tx.get(bookingRef).get().toObject(BookingDoc.class);
                if (booking == null) {
                    throw new ResourceNotFoundException("Booking not found: " + bookingId);
                }
                // Guard: current status must match expected "from"
                if (booking.getStatus() == null || !booking.getStatus().equalsIgnoreCase(from.name())) {
                    throw new BadRequestException("Invalid transition: current status is " + booking.getStatus());
                }

                // Validate allowed actor role and any custom guard conditions based on the transition.
                validateGuards(booking, from, to, actorId);

                // Apply side‑effect if supplied.
                if (sideEffect != null) {
                    sideEffect.apply(tx, booking);
                }

                // Update status.
                booking.setStatus(to.name());
                tx.set(bookingRef, booking);

                // Append event.
                BookingEvent event = BookingEvent.builder()
                        .actorId(actorId)
                        .actorRole(determineRole(actorId))
                        .fromStatus(from.name())
                        .toStatus(to.name())
                        .timestamp(new Date())
                        .metadata(metadata != null ? new com.google.gson.Gson().toJson(metadata) : null)
                        .build();
                DocumentReference eventRef = bookingRef.collection("events").document();
                tx.set(eventRef, event);

                return booking;
            }).get();
        } catch (Exception e) {
            // Wrap checked exceptions for Spring handling.
            if (e instanceof RuntimeException) {
                throw (RuntimeException) e;
            }
            throw new RuntimeException(e);
        }
    }

    /**
     * Validate guard conditions for a specific transition.
     * This method encodes the table from the design doc. Extend as new transitions are added.
     */
    private void validateGuards(BookingDoc booking,
                                BookingStatus from,
                                BookingStatus to,
                                String actorId) {
        // Example guard: only a provider can move from REQUESTED to ACCEPTED.
        if (from == BookingStatus.REQUESTED && to == BookingStatus.ACCEPTED) {
            if (!Objects.equals(booking.getProviderId(), actorId)) {
                throw new ForbiddenException("Only the assigned provider can accept a booking.");
            }
        }
        // Additional guards (mode checks, timestamps, etc.) can be added here following the design.
        // For brevity, omitted; they will be implemented per transition in later commits.
    }

    /**
     * Determine role string for audit purposes. Simplified – real implementation should read the
     * user's role from Firestore or the auth token.
     */
    private String determineRole(String uid) {
        // Placeholder: assume SYSTEM for internal scheduler calls.
        if ("SYSTEM".equals(uid)) {
            return "SYSTEM";
        }
        // In production, lookup user doc and read role field.
        return "UNKNOWN";
    }

    /** Functional interface for side‑effects inside a transaction. */
    @FunctionalInterface
    public interface TransactionSideEffect {
        void apply(Transaction tx, BookingDoc booking) throws Exception;
    }
}
