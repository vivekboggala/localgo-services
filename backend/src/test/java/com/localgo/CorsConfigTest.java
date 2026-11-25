package com.localgo;

import com.localgo.config.CorsConfig;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.*;

class CorsConfigTest {

    @Test
    void allowsVercelAndLocalhostOrigins() {
        CorsConfig corsConfig = new CorsConfig();
        CorsConfigurationSource source = corsConfig.corsConfigurationSource();

        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/auth/send-otp");
        CorsConfiguration config = source.getCorsConfiguration(request);
        assertNotNull(config);

        assertEquals("https://localgo-services.vercel.app",
                config.checkOrigin("https://localgo-services.vercel.app"));
        assertEquals("https://localgo-provider.vercel.app",
                config.checkOrigin("https://localgo-provider.vercel.app"));
        assertEquals("http://localhost:5173",
                config.checkOrigin("http://localhost:5173"));
        assertEquals("http://127.0.0.1:4173",
                config.checkOrigin("http://127.0.0.1:4173"));
    }
}
