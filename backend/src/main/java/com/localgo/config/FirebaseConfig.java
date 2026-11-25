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
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

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
            try (InputStream is = resolveCredentialsStream()) {
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

    private InputStream resolveCredentialsStream() throws IOException {
        String inlineJson = firstNonBlank(
                System.getenv("FIREBASE_CREDENTIALS_JSON"),
                System.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        );
        if (inlineJson != null) {
            log.info("Loading Firebase credentials from inline JSON environment variable");
            return new ByteArrayInputStream(inlineJson.trim().getBytes(StandardCharsets.UTF_8));
        }

        String credPath = firstNonBlank(
                System.getenv("FIREBASE_CREDENTIALS_PATH"),
                System.getenv("APP_FIREBASE_CREDENTIAL_PATH"),
                System.getenv("GOOGLE_APPLICATION_CREDENTIALS"),
                credentialPath
        );

        if (credPath != null && credPath.trim().startsWith("{")) {
            log.info("Loading Firebase credentials from inline JSON in credential path variable");
            return new ByteArrayInputStream(credPath.trim().getBytes(StandardCharsets.UTF_8));
        }

        if (credPath == null) {
            File renderSecret = findRenderSecretFile();
            if (renderSecret != null) {
                log.info("Auto-detected Firebase credentials in Render secrets: {}", renderSecret.getAbsolutePath());
                return new FileInputStream(renderSecret);
            }

            throw new IllegalStateException(
                    "CRITICAL CONFIGURATION ERROR: Firebase Admin credentials are not configured! " +
                    "Set FIREBASE_CREDENTIALS_PATH (or mount a Render Secret File under /etc/secrets/) " +
                    "or set FIREBASE_CREDENTIALS_JSON to your Firebase service account JSON."
            );
        }

        String cleanPath = credPath.trim();
        if (cleanPath.startsWith("file:")) {
            cleanPath = cleanPath.substring(5);
        }

        File keyFile = new File(cleanPath);
        if (keyFile.exists() && keyFile.isFile()) {
            log.info("Loading Firebase credentials from file path: {}", keyFile.getAbsolutePath());
            return new FileInputStream(keyFile);
        }

        if (cleanPath.startsWith("classpath:")) {
            String cpPath = cleanPath.substring(10);
            InputStream cpStream = getClass().getClassLoader().getResourceAsStream(cpPath);
            if (cpStream == null) {
                throw new IllegalStateException("Firebase credentials classpath resource not found: " + cpPath);
            }
            log.info("Loading Firebase credentials from classpath resource: {}", cpPath);
            return cpStream;
        }

        InputStream fallbackStream = getClass().getClassLoader().getResourceAsStream(cleanPath);
        if (fallbackStream != null) {
            log.info("Loading Firebase credentials from classpath fallback: {}", cleanPath);
            return fallbackStream;
        }

        throw new IllegalStateException(
                "CRITICAL CONFIGURATION ERROR: Firebase service account key file was not found at specified path: " + cleanPath
        );
    }

    private File findRenderSecretFile() {
        File secretsDir = new File("/etc/secrets");
        if (!secretsDir.exists() || !secretsDir.isDirectory()) {
            return null;
        }
        File[] files = secretsDir.listFiles((dir, name) -> name.toLowerCase().endsWith(".json"));
        if (files == null || files.length == 0) {
            return null;
        }
        return Arrays.stream(files)
                .filter(f -> f.getName().toLowerCase().contains("firebase"))
                .findFirst()
                .orElse(files[0]);
    }

    private String firstNonBlank(String... candidates) {
        if (candidates == null) {
            return null;
        }
        for (String candidate : candidates) {
            if (candidate != null && !candidate.trim().isEmpty()) {
                return candidate;
            }
        }
        return null;
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
