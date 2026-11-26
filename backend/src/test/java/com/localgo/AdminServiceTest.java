package com.localgo;

import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.localgo.dto.response.ProviderResponse;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
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
}
