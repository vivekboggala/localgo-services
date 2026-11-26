package com.localgo;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;

public class FirebaseTest {

    @Test
    public void testFirestoreConnection() throws Exception {
        File keyFile = new File("src/main/resources/localgo-824dd-firebase-adminsdk-fbsvc-274cd5adb8.json");
        Assumptions.assumeTrue(keyFile.exists(), "Skipping live Firestore probe when Firebase service account JSON is absent (CI)");
        InputStream serviceAccount = new FileInputStream(keyFile);
        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .setProjectId("localgo-824dd")
                .build();

        FirebaseApp app;
        if (FirebaseApp.getApps().isEmpty()) {
            app = FirebaseApp.initializeApp(options);
        } else {
            app = FirebaseApp.getInstance();
        }

        Firestore db = FirestoreClient.getFirestore(app);
        assertNotNull(db);

        // Test writing and reading a probe document
        Map<String, Object> data = new HashMap<>();
        data.put("status", "connected");
        data.put("timestamp", System.currentTimeMillis());

        db.collection("_health_check").document("probe").set(data).get();
        System.out.println(">>> SUCCESSFULLY CONNECTED TO FIRESTORE ON localgo-824dd <<<");
        
        var snapshot = db.collection("_health_check").document("probe").get().get();
        System.out.println("Probe doc read: " + snapshot.getData());
    }
}
