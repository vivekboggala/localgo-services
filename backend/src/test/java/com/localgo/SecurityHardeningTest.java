package com.localgo;

import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.Transaction;
import com.google.cloud.firestore.WriteResult;
import com.localgo.dto.request.BookingRequest;
import com.localgo.dto.request.StatusUpdateRequest;
import com.localgo.dto.response.BookingResponse;
import com.localgo.dto.response.ProviderResponse;
import com.localgo.enums.BookingStatus;
import com.localgo.exception.ForbiddenException;
import com.localgo.exception.GlobalExceptionHandler;
import com.localgo.exception.RateLimitExceededException;
import com.localgo.model.BookingDoc;
import com.localgo.model.ProviderDoc;
import com.localgo.model.ProviderServiceItem;
import com.localgo.model.ServiceDoc;
import com.localgo.service.AuthRateLimiterService;
import com.localgo.service.AuthRateLimiterService.LimitType;
import com.localgo.service.BookingService;
import com.localgo.service.ProviderService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityHardeningTest {

    @Mock
    private Firestore firestore;

    @Mock
    private CollectionReference bookingsCollection;

    @Mock
    private CollectionReference providersCollection;

    @Mock
    private CollectionReference providerPrivateCollection;

    @Mock
    private CollectionReference servicesCollection;

    @Mock
    private CollectionReference usersCollection;

    @Mock
    private DocumentReference bookingDocRef;

    @Mock
    private DocumentSnapshot bookingSnap;

    @Test
    void cancelBookingEnforcesOwnershipAndAllowsAdmin() throws Exception {
        BookingService bookingService = new BookingService(firestore);
        BookingDoc existing = BookingDoc.builder()
                .id("b-1")
                .customerId("cust-1")
                .providerId("prov-1")
                .status(BookingStatus.ACCEPTED.name())
                .amount(30000L)
                .build();

        when(firestore.collection("bookings")).thenReturn(bookingsCollection);
        when(bookingsCollection.document("b-1")).thenReturn(bookingDocRef);
        when(bookingDocRef.get()).thenReturn(ApiFutures.immediateFuture(bookingSnap));
        when(bookingSnap.exists()).thenReturn(true);
        when(bookingSnap.toObject(BookingDoc.class)).thenReturn(existing);
        when(firestore.collection("users")).thenReturn(usersCollection);

        DocumentReference strangerUserRef = mock(DocumentReference.class);
        DocumentSnapshot strangerSnap = mock(DocumentSnapshot.class);
        when(usersCollection.document("stranger-99")).thenReturn(strangerUserRef);
        when(strangerUserRef.get()).thenReturn(ApiFutures.immediateFuture(strangerSnap));
        when(strangerSnap.exists()).thenReturn(false);

        assertThrows(ForbiddenException.class,
                () -> bookingService.cancelBooking("b-1", "stranger-99", "not mine"));

        when(bookingDocRef.set(any(BookingDoc.class))).thenReturn(ApiFutures.immediateFuture(mock(WriteResult.class)));
        BookingResponse adminCancelled = bookingService.cancelBooking("b-1", "admin-1", "ops cancel", true);
        assertEquals(BookingStatus.CANCELLED, adminCancelled.getStatus());
        assertEquals("admin-1", adminCancelled.getCancelledBy());
    }

    @Test
    void createBookingIgnoresClientAmountAndIsolatesStartOtpSecret() throws Exception {
        BookingService bookingService = new BookingService(firestore);

        BookingRequest request = new BookingRequest();
        request.setProviderId("prov-1");
        request.setServiceId("plumber");
        request.setDescription("Fix tap");
        request.setLatitude(12.97);
        request.setLongitude(77.59);
        request.setAddress("123 Main St");
        request.setScheduledDate(LocalDate.now().plusDays(1));
        request.setScheduledTime(LocalTime.of(11, 0));
        request.setPaymentMethod("CASH");
        request.setAmount(1.0); // Malicious client attempts ₹1 instead of ₹349

        ProviderDoc provider = ProviderDoc.builder()
                .id("prov-1")
                .name("Bob Plumbing")
                .services(List.of(ProviderServiceItem.builder()
                        .serviceId("plumber")
                        .serviceName("Plumber")
                        .startingPrice(34900L)
                        .build()))
                .build();

        Transaction transaction = mock(Transaction.class);
        when(firestore.runTransaction(any())).thenAnswer(inv -> {
            com.google.cloud.firestore.Transaction.Function<BookingResponse> fn = inv.getArgument(0);
            return ApiFutures.immediateFuture(fn.updateCallback(transaction));
        });

        when(firestore.collection("bookings")).thenReturn(bookingsCollection);
        when(firestore.collection("users")).thenReturn(usersCollection);
        when(firestore.collection("providers")).thenReturn(providersCollection);
        when(firestore.collection("provider_private")).thenReturn(providerPrivateCollection);
        when(firestore.collection("services")).thenReturn(servicesCollection);

        Query conflictQuery = mock(Query.class);
        QuerySnapshot emptyQuerySnap = mock(QuerySnapshot.class);
        when(bookingsCollection.whereEqualTo(anyString(), any())).thenReturn(conflictQuery);
        when(conflictQuery.whereEqualTo(anyString(), any())).thenReturn(conflictQuery);
        when(conflictQuery.whereIn(anyString(), any())).thenReturn(conflictQuery);
        when(transaction.get(conflictQuery)).thenReturn(ApiFutures.immediateFuture(emptyQuerySnap));
        when(emptyQuerySnap.getDocuments()).thenReturn(Collections.emptyList());

        DocumentReference custRef = mock(DocumentReference.class);
        DocumentSnapshot custSnap = mock(DocumentSnapshot.class);
        when(usersCollection.document("cust-1")).thenReturn(custRef);
        when(transaction.get(custRef)).thenReturn(ApiFutures.immediateFuture(custSnap));
        when(custSnap.exists()).thenReturn(true);
        when(custSnap.getString("name")).thenReturn("Alice");
        when(custSnap.getString("phone")).thenReturn("9999999999");

        DocumentReference provRef = mock(DocumentReference.class);
        DocumentSnapshot provSnap = mock(DocumentSnapshot.class);
        when(providersCollection.document("prov-1")).thenReturn(provRef);
        when(transaction.get(provRef)).thenReturn(ApiFutures.immediateFuture(provSnap));
        when(provSnap.exists()).thenReturn(true);
        when(provSnap.getString("name")).thenReturn("Bob Plumbing");
        when(provSnap.getString("phone")).thenReturn(null);
        when(provSnap.toObject(ProviderDoc.class)).thenReturn(provider);

        DocumentReference privRef = mock(DocumentReference.class);
        DocumentSnapshot privSnap = mock(DocumentSnapshot.class);
        when(providerPrivateCollection.document("prov-1")).thenReturn(privRef);
        when(transaction.get(privRef)).thenReturn(ApiFutures.immediateFuture(privSnap));
        when(privSnap.exists()).thenReturn(true);
        when(privSnap.getString("phone")).thenReturn("+91 98765 00000");

        DocumentReference svcRef = mock(DocumentReference.class);
        DocumentSnapshot svcSnap = mock(DocumentSnapshot.class);
        when(servicesCollection.document("plumber")).thenReturn(svcRef);
        when(transaction.get(svcRef)).thenReturn(ApiFutures.immediateFuture(svcSnap));
        when(svcSnap.exists()).thenReturn(true);
        when(svcSnap.getString("name")).thenReturn("Plumber");

        DocumentReference newBookingRef = mock(DocumentReference.class);
        CollectionReference secretsCol = mock(CollectionReference.class);
        DocumentReference otpSecretRef = mock(DocumentReference.class);
        when(bookingsCollection.document()).thenReturn(newBookingRef);
        when(newBookingRef.getId()).thenReturn("book-new-1");
        when(newBookingRef.collection("secrets")).thenReturn(secretsCol);
        when(secretsCol.document("otp")).thenReturn(otpSecretRef);

        BookingResponse resp = bookingService.createBooking(request, "cust-1");
        assertEquals(0, new java.math.BigDecimal("349.00").compareTo(resp.getAmount()));
        assertNotNull(resp.getStartOtp());
        assertNull(resp.getProviderPhone(), "Provider phone must be hidden before acceptance");

        ArgumentCaptor<BookingDoc> savedBookingCaptor = ArgumentCaptor.forClass(BookingDoc.class);
        verify(transaction).set(eq(newBookingRef), savedBookingCaptor.capture());
        assertEquals(34900L, savedBookingCaptor.getValue().getAmount());
        assertNull(savedBookingCaptor.getValue().getStartOtp(), "startOtp must not be stored on main bookings doc");

        verify(transaction).set(eq(otpSecretRef), any(Map.class));

        // Provider lookup must still omit startOtp even after secrets exist
        when(bookingsCollection.document("book-new-1")).thenReturn(newBookingRef);
        when(newBookingRef.get()).thenReturn(ApiFutures.immediateFuture(bookingSnap));
        when(bookingSnap.exists()).thenReturn(true);
        when(bookingSnap.toObject(BookingDoc.class)).thenReturn(savedBookingCaptor.getValue());

        BookingResponse providerView = bookingService.getBookingById("book-new-1", "prov-1");
        assertNull(providerView.getStartOtp());

        // Provider can verify startOtp via backend transition
        DocumentSnapshot secretSnap = mock(DocumentSnapshot.class);
        when(otpSecretRef.get()).thenReturn(ApiFutures.immediateFuture(secretSnap));
        when(secretSnap.exists()).thenReturn(true);
        when(secretSnap.getString("startOtp")).thenReturn(resp.getStartOtp());
        savedBookingCaptor.getValue().setStatus(BookingStatus.ARRIVED.name());
        when(newBookingRef.set(any(BookingDoc.class))).thenReturn(ApiFutures.immediateFuture(mock(WriteResult.class)));

        StatusUpdateRequest startReq = new StatusUpdateRequest();
        startReq.setStatus(BookingStatus.IN_PROGRESS);
        startReq.setOtp(resp.getStartOtp());
        BookingResponse started = bookingService.updateBookingStatus("book-new-1", startReq, "prov-1");
        assertEquals(BookingStatus.IN_PROGRESS, started.getStatus());
    }

    @Test
    void rateLimiterBlocksExcessOtpRequestsWithRetryAfter() {
        AuthRateLimiterService limiter = new AuthRateLimiterService();
        for (int i = 0; i < 3; i++) {
            limiter.checkLimit("10.0.0.1", "user@example.com", LimitType.OTP_SEND);
        }
        RateLimitExceededException ex = assertThrows(RateLimitExceededException.class,
                () -> limiter.checkLimit("10.0.0.1", "user@example.com", LimitType.OTP_SEND));
        assertTrue(ex.getRetryAfterSeconds() >= 1);
    }

    @Test
    void globalExceptionHandlerHidesInternalErrorsAndMapsSecurityCodes() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        var err500 = handler.handleGenericException(new RuntimeException("sensitive SQL/Firestore secret detail"));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, err500.getStatusCode());
        assertFalse(err500.getBody().getMessage().contains("sensitive"));

        var err403 = handler.handleForbidden(new ForbiddenException("Not allowed"));
        assertEquals(HttpStatus.FORBIDDEN, err403.getStatusCode());

        var err429 = handler.handleRateLimit(new RateLimitExceededException("Slow down", 42));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, err429.getStatusCode());
        assertEquals("42", err429.getHeaders().getFirst("Retry-After"));
    }

    @Test
    void providerPublicMappingOmitsEmailAndPhoneWhilePrivateContactMappingIncludesThem() throws Exception {
        ProviderService providerService = new ProviderService(firestore);
        ProviderDoc doc = ProviderDoc.builder()
                .id("prov-1")
                .name("Safe Tech")
                .email("private@example.com")
                .phone("+91 90000 11111")
                .available(true)
                .lastSeenAt(System.currentTimeMillis())
                .build();

        ProviderResponse publicView = providerService.mapToResponse(doc, 2.5);
        assertNull(publicView.getEmail());
        assertNull(publicView.getPhone());

        when(firestore.collection("provider_private")).thenReturn(providerPrivateCollection);
        DocumentReference privRef = mock(DocumentReference.class);
        DocumentSnapshot privSnap = mock(DocumentSnapshot.class);
        when(providerPrivateCollection.document("prov-1")).thenReturn(privRef);
        when(privRef.get()).thenReturn(ApiFutures.immediateFuture(privSnap));
        when(privSnap.exists()).thenReturn(true);
        when(privSnap.getString("email")).thenReturn("private@example.com");
        when(privSnap.getString("phone")).thenReturn("+91 90000 11111");

        ProviderResponse adminView = providerService.mapToResponseWithContact(doc, 2.5);
        assertEquals("private@example.com", adminView.getEmail());
        assertEquals("+91 90000 11111", adminView.getPhone());
    }
}
