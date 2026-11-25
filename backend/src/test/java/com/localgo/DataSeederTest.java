package com.localgo;

import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.localgo.model.ProviderDoc;
import com.localgo.seed.DataSeeder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataSeederTest {

    @Mock
    private Firestore firestore;

    @Mock
    private CollectionReference providersCollection;

    @Test
    void seedsDemoProvidersOnceWithValidGeohashAndPaisePricing() throws Exception {
        Map<String, ProviderDoc> store = new ConcurrentHashMap<>();
        when(firestore.collection("providers")).thenReturn(providersCollection);
        when(providersCollection.document(anyString())).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            DocumentReference ref = mock(DocumentReference.class);
            lenient().when(ref.get()).thenAnswer(g -> {
                DocumentSnapshot snap = mock(DocumentSnapshot.class);
                when(snap.exists()).thenReturn(store.containsKey(id));
                return ApiFutures.immediateFuture(snap);
            });
            lenient().when(ref.set(any(ProviderDoc.class))).thenAnswer(s -> {
                store.put(id, s.getArgument(0));
                return ApiFutures.immediateFuture(null);
            });
            return ref;
        });

        DataSeeder seeder = new DataSeeder(firestore);
        seeder.seedDemoProviders();

        assertEquals(14, store.size());
        ProviderDoc blrElec = store.get("demo-prov-blr-elec-1");
        assertNotNull(blrElec);
        assertEquals("VERIFIED", blrElec.getVerificationStatus());
        assertTrue(Boolean.TRUE.equals(blrElec.getAvailable()));
        assertNotNull(blrElec.getGeohash());
        assertEquals(12, blrElec.getGeohash().length());
        assertEquals(24900L, blrElec.getServices().get(0).getStartingPrice());

        // Second run is a no-op (1 marker check + 14 writes on first run, 1 marker check on second run)
        seeder.seedDemoProviders();
        verify(providersCollection, times(16)).document(anyString());
    }
}
