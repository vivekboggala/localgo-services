package com.localgo;

import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.localgo.dto.request.StatusUpdateRequest;
import com.localgo.dto.response.BookingResponse;
import com.localgo.dto.response.ReviewResponse;
import com.localgo.enums.BookingStatus;
import com.localgo.enums.NotificationType;
import com.localgo.enums.PaymentStatus;
import com.localgo.exception.BadRequestException;
import com.localgo.model.BookingDoc;
import com.localgo.model.ReviewDoc;
import com.localgo.service.BookingService;
import com.localgo.service.NotificationService;
import com.localgo.service.ReviewService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingBugsFixTest {

    @Mock
    private Firestore firestore;

    @Mock
    private NotificationService notificationService;

    @Mock
    private CollectionReference reviewsCollection;

    @Mock
    private CollectionReference providersCollection;

    @Mock
    private CollectionReference bookingsCollection;

    @Mock
    private DocumentReference providerDocRef;

    @Mock
    private DocumentReference bookingDocRef;

    @Mock
    private DocumentSnapshot bookingSnap;

    @Test
    void hiddenReviewsAreExcludedFromListingAndRatingRecalculation() throws Exception {
        ReviewService reviewService = new ReviewService(firestore);

        QuerySnapshot snap = mock(QuerySnapshot.class);
        QueryDocumentSnapshot visibleDoc = mock(QueryDocumentSnapshot.class);
        QueryDocumentSnapshot hiddenDoc = mock(QueryDocumentSnapshot.class);
        Query query = mock(Query.class);

        ReviewDoc visibleReview = ReviewDoc.builder()
                .id("rev-1").bookingId("b-1").providerId("prov-1").customerName("Alice")
                .rating(4.0).comment("Good").hidden(false).createdAt(new Date()).build();
        ReviewDoc hiddenReview = ReviewDoc.builder()
                .id("rev-2").bookingId("b-2").providerId("prov-1").customerName("Spammer")
                .rating(1.0).comment("Abuse").hidden(true).createdAt(new Date()).build();

        when(firestore.collection("reviews")).thenReturn(reviewsCollection);
        when(reviewsCollection.whereEqualTo("providerId", "prov-1")).thenReturn(query);
        when(query.get()).thenReturn(ApiFutures.immediateFuture(snap));
        when(snap.getDocuments()).thenReturn(List.of(visibleDoc, hiddenDoc));

        when(visibleDoc.getId()).thenReturn("rev-1");
        when(visibleDoc.toObject(ReviewDoc.class)).thenReturn(visibleReview);
        when(visibleDoc.getBoolean("hidden")).thenReturn(false);
        when(visibleDoc.getDouble("rating")).thenReturn(4.0);

        when(hiddenDoc.toObject(ReviewDoc.class)).thenReturn(hiddenReview);
        when(hiddenDoc.getBoolean("hidden")).thenReturn(true);

        List<ReviewResponse> reviews = reviewService.getProviderReviews("prov-1");
        assertEquals(1, reviews.size());
        assertEquals("rev-1", reviews.get(0).getId());

        when(snap.isEmpty()).thenReturn(false);
        when(firestore.collection("providers")).thenReturn(providersCollection);
        when(providersCollection.document("prov-1")).thenReturn(providerDocRef);
        when(providerDocRef.update("rating", 4.0)).thenReturn(ApiFutures.immediateFuture(mock(WriteResult.class)));

        reviewService.recalculateProviderRating("prov-1");
        verify(providerDocRef).update("rating", 4.0);
    }

    @Test
    void bookingStatusNotificationsAndPaymentRulesWorkForUpiAndCash() throws Exception {
        BookingService bookingService = new BookingService(firestore, notificationService);
        BookingDoc upiBooking = BookingDoc.builder()
                .id("b-upi")
                .customerId("cust-1")
                .providerId("prov-1")
                .providerName("Bob")
                .serviceName("Electrician")
                .status(BookingStatus.IN_PROGRESS.name())
                .paymentMethod("UPI")
                .paymentStatus(PaymentStatus.PENDING.name())
                .amount(25000L)
                .build();

        when(firestore.collection("bookings")).thenReturn(bookingsCollection);
        when(bookingsCollection.document("b-upi")).thenReturn(bookingDocRef);
        when(bookingDocRef.get()).thenReturn(ApiFutures.immediateFuture(bookingSnap));
        when(bookingSnap.exists()).thenReturn(true);
        when(bookingSnap.toObject(BookingDoc.class)).thenReturn(upiBooking);
        when(bookingDocRef.set(any(BookingDoc.class))).thenReturn(ApiFutures.immediateFuture(mock(WriteResult.class)));
        when(firestore.collection("providers")).thenReturn(providersCollection);

        StatusUpdateRequest completeReq = new StatusUpdateRequest();
        completeReq.setStatus(BookingStatus.COMPLETED);
        BookingResponse completed = bookingService.updateBookingStatus("b-upi", completeReq, "prov-1");

        assertEquals(BookingStatus.COMPLETED, completed.getStatus());
        assertEquals(PaymentStatus.PENDING, completed.getPaymentStatus(), "UPI must not auto-mark PAID on completion");
        verify(notificationService).createNotification(
                eq("cust-1"), eq(NotificationType.SERVICE_COMPLETED), anyString(), anyString(), eq("b-upi"));

        assertThrows(BadRequestException.class,
                () -> bookingService.confirmCashReceived("b-upi", "prov-1"));
    }

    @Test
    void expiresRequestedBookingsOlderThanTenMinutesAndNotifiesCustomer() throws Exception {
        BookingService bookingService = new BookingService(firestore, notificationService);

        Query query = mock(Query.class);
        QuerySnapshot snap = mock(QuerySnapshot.class);
        QueryDocumentSnapshot staleDoc = mock(QueryDocumentSnapshot.class);
        QueryDocumentSnapshot freshDoc = mock(QueryDocumentSnapshot.class);
        DocumentReference staleRef = mock(DocumentReference.class);

        BookingDoc stale = BookingDoc.builder()
                .customerId("cust-old")
                .providerId("prov-1")
                .serviceName("Plumber")
                .status(BookingStatus.REQUESTED.name())
                .createdAt(new Date(System.currentTimeMillis() - 12 * 60_000L))
                .build();
        BookingDoc fresh = BookingDoc.builder()
                .customerId("cust-new")
                .providerId("prov-1")
                .serviceName("Plumber")
                .status(BookingStatus.REQUESTED.name())
                .createdAt(new Date(System.currentTimeMillis() - 2 * 60_000L))
                .build();

        when(firestore.collection("bookings")).thenReturn(bookingsCollection);
        when(bookingsCollection.whereEqualTo("status", BookingStatus.REQUESTED.name())).thenReturn(query);
        when(query.get()).thenReturn(ApiFutures.immediateFuture(snap));
        when(snap.isEmpty()).thenReturn(false);
        when(snap.getDocuments()).thenReturn(List.of(staleDoc, freshDoc));

        when(staleDoc.getId()).thenReturn("b-stale");
        when(staleDoc.toObject(BookingDoc.class)).thenReturn(stale);
        when(staleDoc.getReference()).thenReturn(staleRef);
        when(staleRef.set(any(BookingDoc.class))).thenReturn(ApiFutures.immediateFuture(mock(WriteResult.class)));

        when(freshDoc.toObject(BookingDoc.class)).thenReturn(fresh);

        int expired = bookingService.expireStaleRequestedBookings();
        assertEquals(1, expired);
        assertEquals(BookingStatus.EXPIRED.name(), stale.getStatus());
        verify(notificationService).createNotification(
                eq("cust-old"), eq(NotificationType.BOOKING_EXPIRED), anyString(), anyString(), eq("b-stale"));
        verify(notificationService, never()).createNotification(
                eq("cust-new"), any(), anyString(), anyString(), anyString());
    }
}
