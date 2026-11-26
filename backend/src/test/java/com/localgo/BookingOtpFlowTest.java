package com.localgo;

import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.localgo.dto.request.StatusUpdateRequest;
import com.localgo.dto.response.BookingResponse;
import com.localgo.enums.BookingStatus;
import com.localgo.enums.PaymentStatus;
import com.localgo.exception.BadRequestException;
import com.localgo.model.BookingDoc;
import com.localgo.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingOtpFlowTest {

    @Mock
    private Firestore firestore;

    @Mock
    private CollectionReference bookingsCollection;

    @Mock
    private DocumentReference bookingDocRef;

    @Mock
    private DocumentSnapshot bookingSnapshot;

    @Mock
    private WriteResult writeResult;

    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(firestore);
    }

    @Test
    void requiresStartOtpOnArrivalAndCompletesDirectlyWithoutCompletionOtp() throws Exception {
        BookingDoc booking = BookingDoc.builder()
                .id("book-1")
                .customerId("cust-1")
                .providerId("prov-1")
                .serviceId("electrician")
                .serviceName("Electrician")
                .status(BookingStatus.ARRIVED.name())
                .amount(24900L)
                .paymentMethod("CASH")
                .paymentStatus(PaymentStatus.PENDING.name())
                .startOtp("4829")
                .completionOtp("9999")
                .build();

        lenient().when(firestore.collection("bookings")).thenReturn(bookingsCollection);
        when(bookingsCollection.document("book-1")).thenReturn(bookingDocRef);
        when(bookingDocRef.get()).thenReturn(ApiFutures.immediateFuture(bookingSnapshot));
        when(bookingSnapshot.exists()).thenReturn(true);
        when(bookingSnapshot.toObject(BookingDoc.class)).thenReturn(booking);
        when(bookingDocRef.set(any(BookingDoc.class))).thenReturn(ApiFutures.immediateFuture(writeResult));
        lenient().when(firestore.collection("providers")).thenReturn(bookingsCollection);

        StatusUpdateRequest wrongStart = new StatusUpdateRequest();
        wrongStart.setStatus(BookingStatus.IN_PROGRESS);
        wrongStart.setOtp("0000");
        assertThrows(BadRequestException.class,
                () -> bookingService.updateBookingStatus("book-1", wrongStart, "prov-1"));

        StatusUpdateRequest validStart = new StatusUpdateRequest();
        validStart.setStatus(BookingStatus.IN_PROGRESS);
        validStart.setOtp("4829");
        BookingResponse started = bookingService.updateBookingStatus("book-1", validStart, "prov-1");
        assertEquals(BookingStatus.IN_PROGRESS, started.getStatus());
        assertNull(started.getCompletionOtp());

        StatusUpdateRequest completeDirect = new StatusUpdateRequest();
        completeDirect.setStatus(BookingStatus.COMPLETED);
        BookingResponse completed = bookingService.updateBookingStatus("book-1", completeDirect, "prov-1");
        assertEquals(BookingStatus.COMPLETED, completed.getStatus());
        assertEquals(PaymentStatus.PAID, completed.getPaymentStatus());
        assertNull(completed.getCompletionOtp());
    }
}
