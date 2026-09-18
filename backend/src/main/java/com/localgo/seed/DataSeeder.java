package com.localgo.seed;

import com.localgo.entity.ServiceEntity;
import com.localgo.entity.User;
import com.localgo.enums.Role;
import com.localgo.repository.ServiceRepository;
import com.localgo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.initial-admin-email:}")
    private String initialAdminEmail;

    @Value("${app.initial-admin-password:}")
    private String initialAdminPassword;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Checking service master data catalog...");

        // 1. Seed Master Service Catalog if empty
        if (serviceRepository.count() == 0) {
            log.info("Seeding master service catalog for LocalGo Services...");
            List<ServiceEntity> services = List.of(
                ServiceEntity.builder().name("AC Repair & Service").category("Appliance").icon("Wrench").description("AC cleaning, gas filling, and repair").defaultDurationMins(90).build(),
                ServiceEntity.builder().name("Electrician").category("Electrical").icon("Zap").description("Wiring, switchboard, light fixtures & fan repair").defaultDurationMins(60).build(),
                ServiceEntity.builder().name("Plumber").category("Plumbing").icon("Droplet").description("Tap repair, leak fixing, pipe fittings & drain cleaning").defaultDurationMins(60).build(),
                ServiceEntity.builder().name("Mobile Repair").category("Gadgets").icon("Smartphone").description("Screen replacement, battery repair & software fix").defaultDurationMins(45).build(),
                ServiceEntity.builder().name("Computer Repair").category("Gadgets").icon("Monitor").description("Laptop/PC repair, OS installation & hardware upgrade").defaultDurationMins(90).build(),
                ServiceEntity.builder().name("Refrigerator Repair").category("Appliance").icon("Box").description("Single/double door fridge repair & gas refilling").defaultDurationMins(75).build(),
                ServiceEntity.builder().name("Washing Machine Repair").category("Appliance").icon("RefreshCw").description("Automatic & semi-automatic machine service").defaultDurationMins(75).build(),
                ServiceEntity.builder().name("Car & Bike Service").category("Vehicle").icon("Truck").description("Two wheeler & four wheeler repair at home").defaultDurationMins(120).build(),
                ServiceEntity.builder().name("Home Cleaning").category("Cleaning").icon("Sparkles").description("Full house deep cleaning & bathroom sanitation").defaultDurationMins(180).build(),
                ServiceEntity.builder().name("House Painting").category("Home Care").icon("Paintbrush").description("Interior & exterior wall painting services").defaultDurationMins(240).build()
            );
            serviceRepository.saveAll(services);
            log.info("Seeded 10 master service categories.");
        }

        // 2. Initial Admin Creation (Environment variable based)
        if (initialAdminEmail != null && !initialAdminEmail.trim().isEmpty() &&
            initialAdminPassword != null && !initialAdminPassword.trim().isEmpty()) {

            String cleanAdminEmail = initialAdminEmail.trim().toLowerCase();

            if (!userRepository.existsByEmail(cleanAdminEmail)) {
                log.info("Creating initial system admin user: {}", cleanAdminEmail);
                User adminUser = User.builder()
                    .name("System Administrator")
                    .email(cleanAdminEmail)
                    .phone("0000000000")
                    .password(passwordEncoder.encode(initialAdminPassword))
                    .role(Role.ADMIN)
                    .emailVerified(true)
                    .build();
                userRepository.save(adminUser);
                log.info("Initial Admin user created successfully.");
            } else {
                log.info("Admin account already exists: {}", cleanAdminEmail);
            }
        } else {
            log.warn("INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD environment variables are missing. Skipping automatic admin creation.");
        }
    }
}
