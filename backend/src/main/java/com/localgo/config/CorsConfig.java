package com.localgo.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
@Slf4j
public class CorsConfig {

    private static final List<String> DEFAULT_ALLOWED_ORIGINS = List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://localgo-services.vercel.app",
            "https://*.vercel.app"
    );

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);

        String allowedOriginsEnv = System.getenv("CORS_ALLOWED_ORIGINS");
        Set<String> originSet = new LinkedHashSet<>(DEFAULT_ALLOWED_ORIGINS);

        if (allowedOriginsEnv != null && !allowedOriginsEnv.trim().isEmpty()) {
            List<String> envOrigins = Arrays.stream(allowedOriginsEnv.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
            originSet.addAll(envOrigins);
            log.info("CORS allowed origins configured (merged with defaults): {}", originSet);
        } else {
            log.info("CORS_ALLOWED_ORIGINS not set, using default allowed origins: {}", originSet);
        }

        List<String> origins = new ArrayList<>(originSet);
        config.setAllowedOriginPatterns(origins);
        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setExposedHeaders(List.of("Authorization", "Content-Type"));
        config.setMaxAge(3600L);
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public CorsFilter corsFilter(CorsConfigurationSource corsConfigurationSource) {
        return new CorsFilter(corsConfigurationSource);
    }
}
