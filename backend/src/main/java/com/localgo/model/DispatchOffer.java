package com.localgo.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * Firestore document representing a dispatch offer sent to a provider.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchOffer {
    private String id;               // Firestore document ID
    private String bookingId;        // linked booking
    private String providerId;       // target provider UID
    private String status;           // PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED
    private Date expiresAt;          // when the offer expires
    private Double distanceKm;       // distance from provider to service location
    private Long estimatedEarningsPaise; // rough earnings estimate
    private Integer wave;           // dispatch wave number
    private Date createdAt;
}
