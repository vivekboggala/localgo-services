package com.localgo.model;

import com.google.cloud.firestore.annotation.Exclude;
import com.google.cloud.firestore.annotation.IgnoreExtraProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IgnoreExtraProperties
public class BookingDoc {
    private List<String> offeredProviderIds; // providers already sent an offer for this booking
    private List<String> rejectedProviderIds; // providers that rejected an offer

    private String id;
    private String customerId;
    private String customerName;
    private String customerPhone;
    private String providerId;
    private String providerName;
    private String providerPhone;
    private String serviceId;
    private String serviceName;
    private String description;
    private Double latitude;
    private Double longitude;
    private String address;
    private String scheduledDate; // string YYYY-MM-DD
    private String scheduledTime; // string HH:mm
    private Integer estimatedDurationMins;
    private String status;
    private String cancelledBy;
    private String cancellationReason;
    private Long amount; // stored in paise (100 paise = 1 INR)
    private Long extraAmountPaise; // optional extra charges in paise
    private String workSummary;
    private String paymentMethod;
    private String paymentStatus;
    private String paymentUtr;
    private Date paymentSubmittedAt;
    @Exclude
    private String startOtp;
    @Exclude
    private String completionOtp;
    private Date acceptedAt;
    private Date onTheWayAt;
    private Date arrivedAt;
    private Date inProgressAt;
    private Date completedAt;
    private Date createdAt;
}
