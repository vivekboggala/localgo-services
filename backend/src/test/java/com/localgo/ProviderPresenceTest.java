package com.localgo;

import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.localgo.controller.ProviderController;
import com.localgo.model.ProviderDoc;
import com.localgo.service.BookingService;
import com.localgo.service.ProviderDashboardService;
import com.localgo.service.ProviderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProviderPresenceTest {

    @Mock
    private Firestore firestore;

    @Mock
    private BookingService bookingService;

    @Mock
    private CollectionReference providersCollection;

    @Mock
    private DocumentReference providerDocRef;

    @Mock
    private DocumentSnapshot providerSnapshot;

    @Mock
    private WriteResult writeResult;

    private ProviderService providerService;
    private ProviderDashboardService dashboardService;

    @BeforeEach
    void setUp() {
        providerService = new ProviderService(firestore);
        dashboardService = new ProviderDashboardService(firestore, bookingService, providerService);
    }

    @Test
    void effectiveAvailabilityHandlesUnloggedActiveStaleAndPausedStates() {
        ProviderDoc unloggedIn = ProviderDoc.builder().available(true).build();
        assertFalse(providerService.isEffectivelyAvailable(unloggedIn));

        ProviderDoc offlineDefault = ProviderDoc.builder().available(false).build();
        assertFalse(providerService.isEffectivelyAvailable(offlineDefault));

        ProviderDoc paused = ProviderDoc.builder()
                .available(true)
                .manualOffline(true)
                .lastSeenAt(System.currentTimeMillis())
                .build();
        assertFalse(providerService.isEffectivelyAvailable(paused));

        ProviderDoc stale = ProviderDoc.builder()
                .available(true)
                .lastSeenAt(System.currentTimeMillis() - ProviderService.PRESENCE_TIMEOUT_MS - 10_000L)
                .build();
        assertFalse(providerService.isEffectivelyAvailable(stale));

        ProviderDoc active = ProviderDoc.builder()
                .available(true)
                .manualOffline(false)
                .lastSeenAt(System.currentTimeMillis())
                .build();
        assertTrue(providerService.isEffectivelyAvailable(active));
    }

    @Test
    void updatePresenceTracksHeartbeatManualPauseAndSignOut() throws Exception {
        when(firestore.collection("providers")).thenReturn(providersCollection);
        when(providersCollection.document("prov-1")).thenReturn(providerDocRef);
        when(providerDocRef.get()).thenReturn(ApiFutures.immediateFuture(providerSnapshot));
        when(providerSnapshot.exists()).thenReturn(true);
        when(providerDocRef.update(anyMap())).thenReturn(ApiFutures.immediateFuture(writeResult));
        when(providerDocRef.update(anyString(), any())).thenReturn(ApiFutures.immediateFuture(writeResult));

        when(providerSnapshot.getBoolean("manualOffline")).thenReturn(false);
        assertTrue(dashboardService.updatePresence("prov-1", true, false));

        when(providerSnapshot.getBoolean("manualOffline")).thenReturn(true);
        assertFalse(dashboardService.updatePresence("prov-1", true, false));

        assertTrue(dashboardService.updatePresence("prov-1", true, true));
        assertFalse(dashboardService.updatePresence("prov-1", false, false));
    }

    @Test
    void controllerAcceptsAllAndBooleanAvailabilityQueryValues() {
        ProviderService mockService = mock(ProviderService.class);
        when(mockService.findNearbyProviders(anyDouble(), anyDouble(), anyDouble(), any(), any(), any(), any(), any()))
                .thenReturn(List.of());
        ProviderController controller = new ProviderController(mockService);

        controller.getNearbyProviders(12.97, 77.59, 15.0, null, null, null, "all", "distance");
        verify(mockService).findNearbyProviders(12.97, 77.59, 15.0, null, null, null, null, "distance");

        controller.getNearbyProviders(12.97, 77.59, 15.0, null, null, null, "true", "distance");
        verify(mockService).findNearbyProviders(12.97, 77.59, 15.0, null, null, null, Boolean.TRUE, "distance");

        controller.getNearbyProviders(12.97, 77.59, 15.0, null, null, null, "false", "distance");
        verify(mockService).findNearbyProviders(12.97, 77.59, 15.0, null, null, null, Boolean.FALSE, "distance");
    }
}
