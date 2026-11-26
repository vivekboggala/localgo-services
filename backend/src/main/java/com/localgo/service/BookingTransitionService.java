package com.localgo.service;

import com.localgo.enums.BookingStatus;
import com.localgo.exception.BadRequestException;
import com.localgo.exception.ForbiddenException;
import com.localgo.exception.ResourceNotFoundException;
import com.localgo.model.BookingDoc;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Thin façade over {@link BookingStateMachine} exposing domain‑specific transition methods.
 * Each method validates the caller role (derived from UID) and forwards to the state machine.
 */
@Service
@Slf4j
@AllArgsConstructor
public class BookingTransitionService {
    private final BookingStateMachine stateMachine;
    private final UserLookupService userLookup; // helper to resolve role from UID

    private String roleOf(String uid) {
        return userLookup.getRole(uid);
    }

    public BookingDoc accept(String bookingId, String providerId) {
        // Provider must be the same UID that is performing the call
        String actorRole = roleOf(providerId);
        if (!"PROVIDER".equalsIgnoreCase(actorRole)) {
            throw new ForbiddenException("Only a provider can accept a booking");
        }
        return stateMachine.transition(
                bookingId,
                BookingStatus.REQUESTED,
                BookingStatus.ACCEPTED,
                providerId,
                Map.of("providerId", providerId),
                (tx, booking) -> {
                    // side‑effect: set providerId and acceptedAt
                    booking.setProviderId(providerId);
                    booking.setAcceptedAt(new java.util.Date());
                }
        );
    }

    // Additional wrappers (onTheWay, arrive, startOtpVerify, complete, cancel) would be added similarly.
    // For brevity only a representative method is shown – the rest follow the same pattern.
}
