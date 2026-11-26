package com.localgo;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.File;

@SpringBootTest
class LocalGoApplicationTests {

    @BeforeAll
    static void requireFirebaseCredentialsForIntegrationContext() {
        boolean hasCreds = (System.getenv("FIREBASE_CREDENTIALS_JSON") != null && !System.getenv("FIREBASE_CREDENTIALS_JSON").isBlank())
                || (System.getenv("FIREBASE_CREDENTIALS_PATH") != null && !System.getenv("FIREBASE_CREDENTIALS_PATH").isBlank())
                || (System.getenv("APP_FIREBASE_CREDENTIAL_PATH") != null && !System.getenv("APP_FIREBASE_CREDENTIAL_PATH").isBlank())
                || new File("src/main/resources/localgo-824dd-firebase-adminsdk-fbsvc-274cd5adb8.json").exists();
        Assumptions.assumeTrue(hasCreds, "Skipping full Spring context load without Firebase credentials");
    }

    @Test
    void contextLoads() {
    }
}
