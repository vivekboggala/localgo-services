package com.localgo;

import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.AggregateQuery;
import com.google.cloud.firestore.AggregateQuerySnapshot;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.localgo.dto.response.ProviderResponse;
import com.localgo.enums.BookingStatus;
import com.localgo.exception.BadRequestException;
import com.localgo.model.NotificationDoc;
import com.localgo.model.ProviderDoc;
import com.localgo.service.AdminService;
import com.localgo.service.BookingService;
import com.localgo.service.ProviderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private Firestore firestore;

    @Mock
    private BookingService bookingService;

    @Mock
    private CollectionReference providersCollection;

    @Mock
    private CollectionReference notificationsCollection;

    @Mock
    private CollectionReference usersCollection;

    @Mock
    private CollectionReference bookingsCollection;

    @Mock
    private CollectionReference servicesCollection;

    @Mock
    private DocumentReference providerDocRef;

    @Mock
    private DocumentReference notificationDocRef;

    @Mock
    private DocumentSnapshot providerSnapshot;

    @Mock
    private WriteResult writeResult;

    private AdminService adminService;

    @BeforeEach
    void setUp() {
        ProviderService providerService = new ProviderService(firestore);
        adminService = new AdminService(firestore, providerService, bookingService);
    }

    @Test
    void rejectsBlankRejectionReasonAndUpdatesVerificationWithNotification() throws Exception {
        assertThrows(BadRequestException.class,
                () -> adminService.verifyProvider("prov-1", "REJECTED", "   ", "admin-1"));

        ProviderDoc verifiedDoc = ProviderDoc.builder()
                .id("prov-1")
                .name("Verified Tech")
                .email("tech@localgo.com")
                .verificationStatus("VERIFIED")
                .verificationNotes("Verified documents")
                .available(true)
                .build();

        when(firestore.collection("providers")).thenReturn(providersCollection);
        when(providersCollection.document("prov-1")).thenReturn(providerDocRef);
        when(providerDocRef.get()).thenReturn(ApiFutures.immediateFuture(providerSnapshot));
        when(providerSnapshot.exists()).thenReturn(true);
        when(providerSnapshot.toObject(ProviderDoc.class)).thenReturn(verifiedDoc);
        when(providerDocRef.update(anyMap())).thenReturn(ApiFutures.immediateFuture(writeResult));

        when(firestore.collection("notifications")).thenReturn(notificationsCollection);
        when(notificationsCollection.document()).thenReturn(notificationDocRef);
        when(notificationDocRef.getId()).thenReturn("notif-1");
        when(notificationDocRef.set(any(NotificationDoc.class))).thenReturn(ApiFutures.immediateFuture(writeResult));

        ProviderResponse updated = adminService.verifyProvider("prov-1", "VERIFIED", "Verified documents", "admin-1");
        assertEquals("VERIFIED", updated.getVerificationStatus());
        assertEquals("Verified documents", updated.getVerificationNotes());
        verify(notificationDocRef).set(any(NotificationDoc.class));
    }

    @Test
    void buildsZeroFilledUsersTrendForWindow() throws Exception {
        Query rangeStartQuery = mock(Query.class);
        Query rangeEndQuery = mock(Query.class);
        QuerySnapshot snapshot = mock(QuerySnapshot.class);

        LocalDate today = LocalDate.now();
        LocalDate twoDaysAgo = today.minusDays(2);
        ZoneId zone = ZoneId.systemDefault();

        QueryDocumentSnapshot custDoc = mock(QueryDocumentSnapshot.class);
        when(custDoc.getDate("createdAt")).thenReturn(Date.from(today.atStartOfDay(zone).toInstant()));
        when(custDoc.getString("role")).thenReturn("CUSTOMER");

        QueryDocumentSnapshot provDoc = mock(QueryDocumentSnapshot.class);
        when(provDoc.getDate("createdAt")).thenReturn(Date.from(twoDaysAgo.atStartOfDay(zone).toInstant()));
        when(provDoc.getString("role")).thenReturn("PROVIDER");

        when(firestore.collection("users")).thenReturn(usersCollection);
        when(usersCollection.whereGreaterThanOrEqualTo(eq("createdAt"), any(Date.class))).thenReturn(rangeStartQuery);
        when(rangeStartQuery.whereLessThan(eq("createdAt"), any(Date.class))).thenReturn(rangeEndQuery);
        when(rangeEndQuery.get()).thenReturn(ApiFutures.immediateFuture(snapshot));
        when(snapshot.getDocuments()).thenReturn(List.of(custDoc, provDoc));

        List<Map<String, Object>> trend = adminService.getUsersTrend(7);
        assertEquals(7, trend.size());

        Map<String, Object> todayPoint = trend.stream()
                .filter(p -> today.toString().equals(p.get("date")))
                .findFirst()
                .orElseThrow();
        assertEquals(1, todayPoint.get("customers"));
        assertEquals(0, todayPoint.get("providers"));

        Map<String, Object> twoDaysPoint = trend.stream()
                .filter(p -> twoDaysAgo.toString().equals(p.get("date")))
                .findFirst()
                .orElseThrow();
        assertEquals(0, twoDaysPoint.get("customers"));
        assertEquals(1, twoDaysPoint.get("providers"));
    }

    @Test
    void aggregatesBookingsBreakdownWithCountQueriesAndCachesResult() throws Exception {
        when(firestore.collection("bookings")).thenReturn(bookingsCollection);
        when(firestore.collection("services")).thenReturn(servicesCollection);

        // Mock status count() queries
        for (BookingStatus status : BookingStatus.values()) {
            Query q = mock(Query.class);
            AggregateQuery agg = mock(AggregateQuery.class);
            AggregateQuerySnapshot aggSnap = mock(AggregateQuerySnapshot.class);
            long count = switch (status) {
                case COMPLETED -> 5L;
                case REQUESTED -> 2L;
                default -> 0L;
            };
            when(bookingsCollection.whereEqualTo("status", status.name())).thenReturn(q);
            when(q.count()).thenReturn(agg);
            when(agg.get()).thenReturn(ApiFutures.immediateFuture(aggSnap));
            when(aggSnap.getCount()).thenReturn(count);
        }

        // Mock 2 master services
        Query servicesLimitQuery = mock(Query.class);
        QuerySnapshot svcSnap = mock(QuerySnapshot.class);
        QueryDocumentSnapshot svc1 = mock(QueryDocumentSnapshot.class);
        when(svc1.getId()).thenReturn("plumber");
        when(svc1.getString("name")).thenReturn("Plumber");
        when(svc1.getString("category")).thenReturn("Plumbing");

        QueryDocumentSnapshot svc2 = mock(QueryDocumentSnapshot.class);
        when(svc2.getId()).thenReturn("ac-repair");
        when(svc2.getString("name")).thenReturn("AC Repair & Service");
        when(svc2.getString("category")).thenReturn("Appliance");

        when(servicesCollection.limit(50)).thenReturn(servicesLimitQuery);
        when(servicesLimitQuery.get()).thenReturn(ApiFutures.immediateFuture(svcSnap));
        when(svcSnap.getDocuments()).thenReturn(List.of(svc1, svc2));

        Query plumberQ = mock(Query.class);
        AggregateQuery plumberAgg = mock(AggregateQuery.class);
        AggregateQuerySnapshot plumberSnap = mock(AggregateQuerySnapshot.class);
        when(bookingsCollection.whereEqualTo("serviceId", "plumber")).thenReturn(plumberQ);
        when(plumberQ.count()).thenReturn(plumberAgg);
        when(plumberAgg.get()).thenReturn(ApiFutures.immediateFuture(plumberSnap));
        when(plumberSnap.getCount()).thenReturn(4L);

        Query acQ = mock(Query.class);
        AggregateQuery acAgg = mock(AggregateQuery.class);
        AggregateQuerySnapshot acSnap = mock(AggregateQuerySnapshot.class);
        when(bookingsCollection.whereEqualTo("serviceId", "ac-repair")).thenReturn(acQ);
        when(acQ.count()).thenReturn(acAgg);
        when(acAgg.get()).thenReturn(ApiFutures.immediateFuture(acSnap));
        when(acSnap.getCount()).thenReturn(3L);

        Map<String, Object> breakdown = adminService.getBookingsBreakdown();
        assertEquals(7L, breakdown.get("totalBookings"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> byStatus = (List<Map<String, Object>>) breakdown.get("byStatus");
        assertEquals(2, byStatus.size());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> byCategory = (List<Map<String, Object>>) breakdown.get("byCategory");
        assertEquals("Plumbing", byCategory.get(0).get("category"));
        assertEquals(4L, byCategory.get(0).get("count"));

        // Second call hits 60s cache (bookingsCollection should not receive extra count queries)
        adminService.getBookingsBreakdown();
        verify(bookingsCollection, times(1)).whereEqualTo("status", "COMPLETED");
        verify(bookingsCollection, never()).get();
    }

    @Test
    @SuppressWarnings("unchecked")
    void computesKpiPeriodDeltasOnDashboardOverview() throws Exception {
        LocalDate today = LocalDate.now();
        LocalDate prevPeriodDay = today.minusDays(9); // inside previous 7-day window [today-13 .. today-7]
        ZoneId zone = ZoneId.systemDefault();

        QueryDocumentSnapshot userCurrent = mock(QueryDocumentSnapshot.class);
        when(userCurrent.getString("role")).thenReturn("CUSTOMER");
        when(userCurrent.getDate("createdAt")).thenReturn(Date.from(today.minusDays(1).atStartOfDay(zone).toInstant()));

        QueryDocumentSnapshot userCurrent2 = mock(QueryDocumentSnapshot.class);
        when(userCurrent2.getString("role")).thenReturn("CUSTOMER");
        when(userCurrent2.getDate("createdAt")).thenReturn(Date.from(today.atStartOfDay(zone).toInstant()));

        QueryDocumentSnapshot userPrev = mock(QueryDocumentSnapshot.class);
        when(userPrev.getString("role")).thenReturn("CUSTOMER");
        when(userPrev.getDate("createdAt")).thenReturn(Date.from(prevPeriodDay.atStartOfDay(zone).toInstant()));

        QuerySnapshot usersSnap = mock(QuerySnapshot.class);
        when(usersSnap.getDocuments()).thenReturn(List.of(userCurrent, userCurrent2, userPrev));

        QuerySnapshot providersSnap = mock(QuerySnapshot.class);
        when(providersSnap.size()).thenReturn(1);
        QueryDocumentSnapshot provDoc = mock(QueryDocumentSnapshot.class);
        when(provDoc.getString("verificationStatus")).thenReturn("VERIFIED");
        when(providersSnap.getDocuments()).thenReturn(List.of(provDoc));

        QueryDocumentSnapshot bookCur = mock(QueryDocumentSnapshot.class);
        when(bookCur.getString("status")).thenReturn("COMPLETED");
        when(bookCur.getString("paymentStatus")).thenReturn("PAID");
        when(bookCur.getLong("amount")).thenReturn(60000L);
        when(bookCur.getString("scheduledDate")).thenReturn(today.toString());

        QueryDocumentSnapshot bookPrev = mock(QueryDocumentSnapshot.class);
        when(bookPrev.getString("status")).thenReturn("COMPLETED");
        when(bookPrev.getString("paymentStatus")).thenReturn("PAID");
        when(bookPrev.getLong("amount")).thenReturn(40000L);
        when(bookPrev.getString("scheduledDate")).thenReturn(prevPeriodDay.toString());

        QuerySnapshot bookingsSnap = mock(QuerySnapshot.class);
        when(bookingsSnap.size()).thenReturn(2);
        when(bookingsSnap.getDocuments()).thenReturn(List.of(bookCur, bookPrev));

        when(firestore.collection("users")).thenReturn(usersCollection);
        when(usersCollection.get()).thenReturn(ApiFutures.immediateFuture(usersSnap));
        when(firestore.collection("providers")).thenReturn(providersCollection);
        when(providersCollection.get()).thenReturn(ApiFutures.immediateFuture(providersSnap));
        when(firestore.collection("bookings")).thenReturn(bookingsCollection);
        when(bookingsCollection.get()).thenReturn(ApiFutures.immediateFuture(bookingsSnap));

        Map<String, Object> overview = adminService.getDashboardOverview(7);
        assertEquals(3L, overview.get("totalCustomers"));
        assertEquals(new BigDecimal("1000.00"), overview.get("totalRealizedRevenue"));

        Map<String, Object> deltas = (Map<String, Object>) overview.get("deltas");
        assertNotNull(deltas);
        Map<String, Object> revDelta = (Map<String, Object>) deltas.get("revenue");
        assertEquals(50, revDelta.get("pct")); // +50% (600 vs 400)

        Map<String, Object> custDelta = (Map<String, Object>) deltas.get("newCustomers");
        assertEquals(2L, custDelta.get("current"));
        assertEquals(1L, custDelta.get("previous"));
        assertEquals(100, custDelta.get("pct")); // +100% (2 vs 1)
    }
}
