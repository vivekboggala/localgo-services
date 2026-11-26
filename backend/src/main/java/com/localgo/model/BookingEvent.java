package com.localgo.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * Immutable audit record for a booking status transition.
 * Stored under bookings/{bookingId}/events/{eventId}
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingEvent {
    private String actorId;          // uid of the user (customer, provider, admin, system)
    private String actorRole;        // ROLE_CUSTOMER, ROLE_PROVIDER, ROLE_ADMIN, SYSTEM
    private String fromStatus;       // BookingStatus name before transition
    private String toStatus;         // BookingStatus name after transition
    private Date timestamp;          // server timestamp when transition occurred
    private String metadata;         // optional JSON string for extra data (e.g., reason)
}
