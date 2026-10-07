package com.localgo.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.cloud.FirestoreClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${app.firebase.credential-path:}")
    private String credentialPath;

    @Value("${app.firebase.project-id:localgo-824dd}")
    private String projectId;

    @PostConstruct
    public void initFirebase() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            String credPath = System.getenv("FIREBASE_CREDENTIALS_PATH");
            if (credPath == null || credPath.trim().isEmpty()) {
                credPath = credentialPath;
            }

            if (credPath == null || credPath.trim().isEmpty()) {
                throw new IllegalStateException(
                        "CRITICAL CONFIGURATION ERROR: Firebase Admin credential path is not configured! " +
                        "Please set the FIREBASE_CREDENTIALS_PATH environment variable to the file path of your Firebase service account JSON key file."
                );
            }

            String cleanPath = credPath.trim();
            if (cleanPath.startsWith("file:")) {
                cleanPath = cleanPath.substring(5);
            }

            InputStream serviceAccountStream;
            File keyFile = new File(cleanPath);

            if (keyFile.exists() && keyFile.isFile()) {
                log.info("Loading Firebase credentials from file path: {}", keyFile.getAbsolutePath());
                serviceAccountStream = new FileInputStream(keyFile);
            } else if (cleanPath.startsWith("classpath:")) {
                String cpPath = cleanPath.substring(10);
                serviceAccountStream = getClass().getClassLoader().getResourceAsStream(cpPath);
                if (serviceAccountStream == null) {
                    throw new IllegalStateException("Firebase credentials classpath resource not found: " + cpPath);
                }
                log.info("Loading Firebase credentials from classpath resource: {}", cpPath);
            } else {
                // Try classpath resource as fallback
                serviceAccountStream = getClass().getClassLoader().getResourceAsStream(cleanPath);
                if (serviceAccountStream == null) {
                    throw new IllegalStateException(
                            "CRITICAL CONFIGURATION ERROR: Firebase service account key file was not found at specified path: " + cleanPath
                    );
                }
                log.info("Loading Firebase credentials from classpath fallback: {}", cleanPath);
            }

            try (InputStream is = serviceAccountStream) {
                FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(is));
                if (projectId != null && !projectId.trim().isEmpty()) {
                    optionsBuilder.setProjectId(projectId);
                }
                FirebaseApp.initializeApp(optionsBuilder.build());
                log.info("FirebaseApp initialized successfully for project: {}", projectId);
            }
        }
    }

    @Bean
    public Firestore firestore() {
        return FirestoreClient.getFirestore();
    }

    @Bean
    public FirebaseAuth firebaseAuth() {
        return FirebaseAuth.getInstance();
    }
}
