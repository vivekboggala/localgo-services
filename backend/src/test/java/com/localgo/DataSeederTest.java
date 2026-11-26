package com.localgo;

import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.localgo.model.ProviderDoc;
import com.localgo.model.UserDoc;
import com.localgo.seed.DataSeeder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataSeederTest {

    @Mock
    private Firestore firestore;

    @Mock
    private FirebaseAuth firebaseAuth;

    @Mock
    private CollectionReference providersCollection;

    @Mock
    private CollectionReference usersCollection;

    @Test
    void seedsDemoProvidersAndLoginAccountsOnce() throws Exception {
        Map<String, ProviderDoc> providerStore = new ConcurrentHashMap<>();
        Map<String, UserDoc> userStore = new ConcurrentHashMap<>();

        when(firestore.collection("providers")).thenReturn(providersCollection);
        when(firestore.collection("users")).thenReturn(usersCollection);

        when(providersCollection.document(anyString())).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            DocumentReference ref = mock(DocumentReference.class);
            lenient().when(ref.get()).thenAnswer(g -> {
                DocumentSnapshot snap = mock(DocumentSnapshot.class);
                when(snap.exists()).thenReturn(providerStore.containsKey(id));
                return ApiFutures.immediateFuture(snap);
            });
            lenient().when(ref.set(any(ProviderDoc.class))).thenAnswer(s -> {
                providerStore.put(id, s.getArgument(0));
                return ApiFutures.immediateFuture(null);
            });
            return ref;
        });

        when(usersCollection.document(anyString())).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            DocumentReference ref = mock(DocumentReference.class);
            lenient().when(ref.get()).thenAnswer(g -> {
                DocumentSnapshot snap = mock(DocumentSnapshot.class);
                when(snap.exists()).thenReturn(userStore.containsKey(id));
                return ApiFutures.immediateFuture(snap);
            });
            lenient().when(ref.set(any(UserDoc.class))).thenAnswer(s -> {
                userStore.put(id, s.getArgument(0));
                return ApiFutures.immediateFuture(null);
            });
            return ref;
        });

        FirebaseAuthException notFound = mock(FirebaseAuthException.class);
        when(firebaseAuth.getUser(anyString())).thenThrow(notFound);
        when(firebaseAuth.getUserByEmail(anyString())).thenThrow(notFound);
        AtomicInteger counter = new AtomicInteger();
        when(firebaseAuth.createUser(any(UserRecord.CreateRequest.class))).thenAnswer(inv -> {
            counter.incrementAndGet();
            return mock(UserRecord.class);
        });

        DataSeeder seeder = new DataSeeder(firestore, firebaseAuth);
        seeder.setDemoProviderPassword("TestEnvPass@999");
        seeder.seedDemoProviders();

        assertEquals(22, providerStore.size());
        assertEquals(22, userStore.size());
        assertEquals(22, counter.get());

        ProviderDoc blrElec = providerStore.get("demo-prov-blr-elec-1");
        assertNotNull(blrElec);
        assertEquals("VERIFIED", blrElec.getVerificationStatus());
        assertFalse(Boolean.TRUE.equals(blrElec.getAvailable()));
        assertEquals(0, blrElec.getCompletedJobs());
        assertNotNull(blrElec.getGeohash());
        assertEquals(12, blrElec.getGeohash().length());
        assertEquals(24900L, blrElec.getServices().get(0).getStartingPrice());

        assertNotNull(providerStore.get("demo-prov-mpl-5"));
        assertNotNull(providerStore.get("demo-prov-plmnr-1"));
        assertNotNull(providerStore.get("demo-prov-plmnr-4"));
        assertNotNull(userStore.get("demo-prov-plmnr-4"));

        UserDoc blrUser = userStore.get("demo-prov-blr-elec-1");
        assertNotNull(blrUser);
        assertEquals("PROVIDER", blrUser.getRole());
        assertTrue(Boolean.TRUE.equals(blrUser.getEmailVerified()));
        assertEquals("rajesh.kumar@localgo.com", blrUser.getEmail());

        // Second run is a no-op
        seeder.seedDemoProviders();
        verify(firebaseAuth, times(22)).createUser(any(UserRecord.CreateRequest.class));

        // Admin account is seeded once
        seeder.seedAdminAccount();
        UserDoc adminUser = userStore.get("demo-admin-1");
        assertNotNull(adminUser);
        assertEquals("ADMIN", adminUser.getRole());
        assertEquals("admin@localgo.com", adminUser.getEmail());
        seeder.seedAdminAccount();
        verify(firebaseAuth, times(23)).createUser(any(UserRecord.CreateRequest.class));
    }
}
