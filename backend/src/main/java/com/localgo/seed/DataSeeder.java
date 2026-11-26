package com.localgo.seed;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.localgo.enums.Role;
import com.localgo.model.ProviderDoc;
import com.localgo.model.ProviderServiceItem;
import com.localgo.model.ServiceDoc;
import com.localgo.model.UserDoc;
import com.localgo.util.GeoUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private static final String DEMO_MARKER_PROVIDER_ID = "demo-prov-plmnr-4";
    private static final String DEMO_ADMIN_ID = "demo-admin-1";
    private static final String DEMO_ADMIN_EMAIL = "admin@localgo.com";
    private static final String DEFAULT_DEMO_PROVIDER_PASSWORD = "LocalGo@123";

    private final Firestore firestore;
    private final FirebaseAuth firebaseAuth;

    @Value("${app.seed.demo-provider-password:LocalGo@123}")
    private String demoProviderPassword;

    @Override
    public void run(String... args) throws Exception {
        seedServices();
        seedDemoProviders();
        seedAdminAccount();
        reconcileDemoProviderStates();
    }

    private void seedServices() throws Exception {
        log.info("Checking master service catalog in Firestore...");

        var servicesCollection = firestore.collection("services");
        var existing = servicesCollection.get().get();

        if (existing.isEmpty()) {
            log.info("Seeding fixed master service catalog (10 categories) into Firestore...");
            List<ServiceDoc> services = List.of(
                ServiceDoc.builder().id("ac-repair").name("AC Repair & Service").category("Appliance").icon("Wrench").description("AC cleaning, gas filling, and repair").defaultDurationMins(90).build(),
                ServiceDoc.builder().id("electrician").name("Electrician").category("Electrical").icon("Zap").description("Wiring, switchboard, light fixtures & fan repair").defaultDurationMins(60).build(),
                ServiceDoc.builder().id("plumber").name("Plumber").category("Plumbing").icon("Droplet").description("Tap repair, leak fixing, pipe fittings & drain cleaning").defaultDurationMins(60).build(),
                ServiceDoc.builder().id("mobile-repair").name("Mobile Repair").category("Gadgets").icon("Smartphone").description("Screen replacement, battery repair & software fix").defaultDurationMins(45).build(),
                ServiceDoc.builder().id("computer-repair").name("Computer Repair").category("Gadgets").icon("Monitor").description("Laptop/PC repair, OS installation & hardware upgrade").defaultDurationMins(90).build(),
                ServiceDoc.builder().id("refrigerator-repair").name("Refrigerator Repair").category("Appliance").icon("Box").description("Single/double door fridge repair & gas refilling").defaultDurationMins(75).build(),
                ServiceDoc.builder().id("washing-machine-repair").name("Washing Machine Repair").category("Appliance").icon("RefreshCw").description("Automatic & semi-automatic machine service").defaultDurationMins(75).build(),
                ServiceDoc.builder().id("vehicle-service").name("Car & Bike Service").category("Vehicle").icon("Truck").description("Two wheeler & four wheeler repair at home").defaultDurationMins(120).build(),
                ServiceDoc.builder().id("cleaning").name("Home Cleaning").category("Cleaning").icon("Sparkles").description("Full house deep cleaning & bathroom sanitation").defaultDurationMins(180).build(),
                ServiceDoc.builder().id("painting").name("House Painting").category("Home Care").icon("Paintbrush").description("Interior & exterior wall painting services").defaultDurationMins(240).build()
            );

            for (ServiceDoc s : services) {
                servicesCollection.document(s.getId()).set(s).get();
            }
            log.info("Seeded 10 master service categories into Firestore successfully.");
        } else {
            log.info("Master service catalog already populated (count: {}).", existing.size());
        }
    }

    public void seedDemoProviders() throws Exception {
        var providersCollection = firestore.collection("providers");
        var usersCollection = firestore.collection("users");

        boolean providersSeeded = providersCollection.document(DEMO_MARKER_PROVIDER_ID).get().get().exists();
        boolean accountsSeeded = usersCollection.document(DEMO_MARKER_PROVIDER_ID).get().get().exists();

        if (providersSeeded && accountsSeeded) {
            log.info("Demo providers and login accounts already seeded in Firestore.");
            return;
        }

        List<ProviderDoc> demoProviders = buildDemoProviders();
        int seededCount = 0;
        for (ProviderDoc provider : demoProviders) {
            boolean hasProviderDoc = providersCollection.document(provider.getId()).get().get().exists();
            if (!hasProviderDoc) {
                providersCollection.document(provider.getId()).set(provider).get();
            }

            boolean hasUserDoc = usersCollection.document(provider.getId()).get().get().exists();
            if (!hasUserDoc) {
                String uid = ensureFirebaseAccount(provider.getId(), provider.getEmail(), provider.getName());
                UserDoc userDoc = UserDoc.builder()
                        .id(uid)
                        .name(provider.getName())
                        .email(provider.getEmail())
                        .phone(provider.getPhone())
                        .role(Role.PROVIDER.name())
                        .emailVerified(true)
                        .createdAt(new Date())
                        .build();
                usersCollection.document(uid).set(userDoc).get();
                seededCount++;
            }
        }
        log.info("Seeded {} verified demo providers and {} new login accounts successfully.", demoProviders.size(), seededCount);
    }

    public void seedAdminAccount() throws Exception {
        var usersCollection = firestore.collection("users");
        if (usersCollection.document(DEMO_ADMIN_ID).get().get().exists()) {
            return;
        }
        String uid = ensureFirebaseAccount(DEMO_ADMIN_ID, DEMO_ADMIN_EMAIL, "LocalGo Admin");
        UserDoc adminDoc = UserDoc.builder()
                .id(uid)
                .name("LocalGo Admin")
                .email(DEMO_ADMIN_EMAIL)
                .phone("+91 90000 00000")
                .role(Role.ADMIN.name())
                .emailVerified(true)
                .createdAt(new Date())
                .build();
        usersCollection.document(uid).set(adminDoc).get();
        log.info("Seeded admin verification account: {}", DEMO_ADMIN_EMAIL);
    }

    /**
     * Reconciles demo provider completedJobs to actual bookings and ensures unlogged-in accounts start offline.
     */
    public void reconcileDemoProviderStates() {
        try {
            var usersCol = firestore.collection("users");
            var providersCol = firestore.collection("providers");
            var bookingsCol = firestore.collection("bookings");
            if (usersCol == null || providersCol == null || bookingsCol == null) return;

            var markerRef = usersCol.document("demo-reconcile-v2");
            if (markerRef.get().get().exists()) {
                return;
            }

            for (ProviderDoc demo : buildDemoProviders()) {
                var ref = providersCol.document(demo.getId());
                var snap = ref.get().get();
                if (!snap.exists()) continue;

                var completedSnap = bookingsCol
                        .whereEqualTo("providerId", demo.getId())
                        .whereEqualTo("status", "COMPLETED")
                        .get().get();
                int actualCompleted = completedSnap != null ? completedSnap.size() : 0;

                Long lastSeenAt = snap.getLong("lastSeenAt");
                if (lastSeenAt == null) {
                    ref.update(
                            "completedJobs", actualCompleted,
                            "available", false,
                            "manualOffline", false
                    ).get();
                } else {
                    ref.update("completedJobs", actualCompleted).get();
                }
            }

            markerRef.set(java.util.Map.of("reconciledAt", System.currentTimeMillis())).get();
            log.info("Reconciled demo provider completedJobs counts and duty status cleanly.");
        } catch (Exception e) {
            log.warn("Skipped demo provider reconciliation: {}", e.getMessage());
        }
    }

    private String ensureFirebaseAccount(String defaultUid, String email, String displayName) {
        String password = (demoProviderPassword != null && !demoProviderPassword.isBlank())
                ? demoProviderPassword
                : DEFAULT_DEMO_PROVIDER_PASSWORD;

        try {
            UserRecord existingById = firebaseAuth.getUser(defaultUid);
            if (existingById != null) {
                return existingById.getUid();
            }
        } catch (FirebaseAuthException ignored) {
        }

        try {
            UserRecord existingByEmail = firebaseAuth.getUserByEmail(email);
            if (existingByEmail != null) {
                return existingByEmail.getUid();
            }
        } catch (FirebaseAuthException ignored) {
        }

        try {
            UserRecord created = firebaseAuth.createUser(
                    new UserRecord.CreateRequest()
                            .setUid(defaultUid)
                            .setEmail(email)
                            .setPassword(password)
                            .setDisplayName(displayName)
                            .setEmailVerified(true)
            );
            return created != null && created.getUid() != null ? created.getUid() : defaultUid;
        } catch (FirebaseAuthException e) {
            log.warn("Could not create Firebase Auth account for {}: {}", email, e.getMessage());
            return defaultUid;
        }
    }

    private List<ProviderDoc> buildDemoProviders() {
        return List.of(
                // Bengaluru (Default Location: 12.9716, 77.5946) - covers all 10 service categories
                buildProvider(
                        "demo-prov-blr-elec-1",
                        "Rajesh Kumar - Master Electrician",
                        "rajesh.kumar@localgo.com",
                        "+91 98765 43210",
                        "Certified Master Electrician with 9+ years experience in house wiring, MCB tripping fixes, switchboards, and inverter setups.",
                        9, 12.9716, 77.5946, 20.0, 4.9, 148,
                        List.of(svc("electrician", "Electrician", 249))
                ),
                buildProvider(
                        "demo-prov-blr-elec-2",
                        "Vikram Sharma - Apex Electricals",
                        "vikram.apex@localgo.com",
                        "+91 98112 34567",
                        "Fast-track electrical specialist for smart Wi-Fi switches, LED profile lighting, and distribution board upgrades.",
                        7, 12.9352, 77.6245, 20.0, 4.8, 112,
                        List.of(svc("electrician", "Electrician", 299))
                ),
                buildProvider(
                        "demo-prov-blr-ac-1",
                        "Suresh Verma - CoolBreeze AC Experts",
                        "suresh.ac@localgo.com",
                        "+91 99110 55667",
                        "Split & window AC jet foam wash, gas refilling, copper pipe welding, and PCB diagnostics.",
                        9, 12.9750, 77.6000, 20.0, 4.9, 184,
                        List.of(
                                svc("ac-repair", "AC Repair & Service", 499),
                                svc("refrigerator-repair", "Refrigerator Repair", 399)
                        )
                ),
                buildProvider(
                        "demo-prov-blr-plumb-1",
                        "Ramesh Patel - Express Plumbing Works",
                        "ramesh.plumber@localgo.com",
                        "+91 98223 44556",
                        "Master plumber for tap & shower leaks, concealed pipe repairs, flush valves, and drain unclogging.",
                        8, 12.9720, 77.5950, 18.0, 4.8, 135,
                        List.of(svc("plumber", "Plumber", 299))
                ),
                buildProvider(
                        "demo-prov-blr-clean-1",
                        "Pooja Sharma - Urban Sparkle Cleaners",
                        "pooja.clean@localgo.com",
                        "+91 98860 11223",
                        "Deep residential cleaning with eco-friendly chemicals, kitchen degreasing, and bathroom sanitation.",
                        5, 12.9300, 77.6150, 20.0, 4.8, 172,
                        List.of(
                                svc("cleaning", "Home Cleaning", 799),
                                svc("painting", "House Painting", 1499)
                        )
                ),
                buildProvider(
                        "demo-prov-blr-tech-1",
                        "Amit Sen - Dr. Tech Gadget Solutions",
                        "amit.tech@localgo.com",
                        "+91 97310 99881",
                        "Hardware and software diagnostics for laptops, MacBooks, desktops, and smartphones at your doorstep.",
                        8, 12.9600, 77.6400, 20.0, 4.9, 165,
                        List.of(
                                svc("computer-repair", "Computer Repair", 449),
                                svc("mobile-repair", "Mobile Repair", 349)
                        )
                ),
                buildProvider(
                        "demo-prov-blr-app-1",
                        "Karthik Gowda - HomeCare Appliances",
                        "karthik.appliances@localgo.com",
                        "+91 98455 77889",
                        "Front-load & top-load washing machine drum repair, refrigerator compressor checks, and AC servicing.",
                        10, 12.9580, 77.5850, 20.0, 4.7, 129,
                        List.of(
                                svc("washing-machine-repair", "Washing Machine Repair", 399),
                                svc("refrigerator-repair", "Refrigerator Repair", 349),
                                svc("ac-repair", "AC Repair & Service", 449)
                        )
                ),
                buildProvider(
                        "demo-prov-blr-auto-1",
                        "Deepak Nair - Doorstep Auto Pitstop",
                        "deepak.auto@localgo.com",
                        "+91 99002 33445",
                        "On-spot two-wheeler & car periodic service, battery jump-start, brake tuning, and oil change.",
                        11, 12.9820, 77.5750, 25.0, 4.8, 194,
                        List.of(svc("vehicle-service", "Car & Bike Service", 499))
                ),

                // Hyderabad Hitec City (17.4435, 78.3772)
                buildProvider(
                        "demo-prov-hyd-1",
                        "Srinivas Rao - Cyberabad Electrical & AC",
                        "srinivas.hyd@localgo.com",
                        "+91 98490 11220",
                        "Certified electrician and AC technician serving Hitec City, Madhapur, and Gachibowli.",
                        10, 17.4435, 78.3772, 20.0, 4.9, 160,
                        List.of(
                                svc("electrician", "Electrician", 249),
                                svc("ac-repair", "AC Repair & Service", 499)
                        )
                ),
                buildProvider(
                        "demo-prov-hyd-2",
                        "Praveen Reddy - Deccan Home Fixes",
                        "praveen.hyd@localgo.com",
                        "+91 98491 22330",
                        "Complete plumbing, appliance repair, and deep home cleaning across West Hyderabad.",
                        7, 17.4399, 78.3910, 20.0, 4.7, 98,
                        List.of(
                                svc("plumber", "Plumber", 279),
                                svc("cleaning", "Home Cleaning", 749),
                                svc("washing-machine-repair", "Washing Machine Repair", 399)
                        )
                ),

                // Chennai T. Nagar (13.0418, 80.2341)
                buildProvider(
                        "demo-prov-chn-1",
                        "Murugan Nathan - Marina Home Tech",
                        "murugan.chn@localgo.com",
                        "+91 98400 44551",
                        "Reliable AC, refrigerator, and electrical troubleshooting across T. Nagar, Adyar, and Anna Nagar.",
                        12, 13.0418, 80.2341, 20.0, 4.8, 142,
                        List.of(
                                svc("ac-repair", "AC Repair & Service", 449),
                                svc("electrician", "Electrician", 229),
                                svc("refrigerator-repair", "Refrigerator Repair", 349)
                        )
                ),

                // Madanapalle Town (13.5500, 78.5000)
                buildProvider(
                        "demo-prov-mpl-1",
                        "Venkatesh Naidu - Rayalaseema Services",
                        "venkatesh.mpl@localgo.com",
                        "+91 94401 66778",
                        "Trusted local electrician, plumber, and appliance technician serving Madanapalle and nearby areas.",
                        9, 13.5500, 78.5000, 20.0, 4.9, 118,
                        List.of(
                                svc("electrician", "Electrician", 199),
                                svc("plumber", "Plumber", 199),
                                svc("ac-repair", "AC Repair & Service", 399)
                        )
                ),
                buildProvider(
                        "demo-prov-mpl-2",
                        "Kiran Kumar - Madanapalle Cool & Appliances",
                        "kiran.mpl@localgo.com",
                        "+91 94402 77881",
                        "Doorstep refrigerator gas refilling, washing machine drum service, and split AC diagnostics across Madanapalle.",
                        8, 13.5535, 78.5042, 20.0, 4.8, 94,
                        List.of(
                                svc("refrigerator-repair", "Refrigerator Repair", 299),
                                svc("washing-machine-repair", "Washing Machine Repair", 349),
                                svc("ac-repair", "AC Repair & Service", 429)
                        )
                ),
                buildProvider(
                        "demo-prov-mpl-3",
                        "Lakshmi Narayana - Horsley Home Cleaners & Painters",
                        "lakshmi.mpl@localgo.com",
                        "+91 94403 88992",
                        "Full-house deep cleaning, bathroom sanitization, and interior/exterior wall painting in Madanapalle.",
                        7, 13.5468, 78.4965, 20.0, 4.8, 106,
                        List.of(
                                svc("cleaning", "Home Cleaning", 699),
                                svc("painting", "House Painting", 1299)
                        )
                ),
                buildProvider(
                        "demo-prov-mpl-4",
                        "Harish Babu - QuickByte Mobile & Laptop Care",
                        "harish.mpl@localgo.com",
                        "+91 94404 99003",
                        "On-site laptop troubleshooting, OS setup, and smartphone screen & battery replacements in Madanapalle.",
                        6, 13.5560, 78.4985, 20.0, 4.9, 89,
                        List.of(
                                svc("mobile-repair", "Mobile Repair", 249),
                                svc("computer-repair", "Computer Repair", 349)
                        )
                ),
                buildProvider(
                        "demo-prov-mpl-5",
                        "Naveen Royal - Royal Auto Pitstop Madanapalle",
                        "naveen.mpl@localgo.com",
                        "+91 94405 11224",
                        "Doorstep bike & car periodic maintenance, battery jump-starts, and residential electrical repairs.",
                        10, 13.5440, 78.5070, 25.0, 4.7, 112,
                        List.of(
                                svc("vehicle-service", "Car & Bike Service", 449),
                                svc("electrician", "Electrician", 199)
                        )
                ),

                // Palamaner Town (13.2000, 78.7500)
                buildProvider(
                        "demo-prov-plmnr-1",
                        "Srinath Reddy - Palamaner Power & Wiring",
                        "srinath.plmnr@localgo.com",
                        "+91 94901 33445",
                        "Licensed electrician and AC service specialist serving Palamaner Town and surrounding mandals.",
                        9, 13.2000, 78.7500, 20.0, 4.9, 102,
                        List.of(
                                svc("electrician", "Electrician", 199),
                                svc("ac-repair", "AC Repair & Service", 399)
                        )
                ),
                buildProvider(
                        "demo-prov-plmnr-2",
                        "Ramesh Babu - Sri Sai Plumbing & Waterworks",
                        "ramesh.plmnr@localgo.com",
                        "+91 94902 44556",
                        "Pipeline leak detection, bathroom fittings, motor pumps, and washing machine or fridge servicing in Palamaner.",
                        8, 13.2032, 78.7540, 20.0, 4.8, 87,
                        List.of(
                                svc("plumber", "Plumber", 199),
                                svc("washing-machine-repair", "Washing Machine Repair", 329),
                                svc("refrigerator-repair", "Refrigerator Repair", 299)
                        )
                ),
                buildProvider(
                        "demo-prov-plmnr-3",
                        "Prasad Verma - Palamaner Tech & Gadget Fix",
                        "prasad.plmnr@localgo.com",
                        "+91 94903 55667",
                        "Doorstep smartphone screen repair, laptop SSD upgrades, and OS recovery across Palamaner.",
                        6, 13.1975, 78.7465, 20.0, 4.8, 76,
                        List.of(
                                svc("mobile-repair", "Mobile Repair", 249),
                                svc("computer-repair", "Computer Repair", 349)
                        )
                ),
                buildProvider(
                        "demo-prov-plmnr-4",
                        "Anitha Devi - Blossom Home Clean & Paint",
                        "anitha.plmnr@localgo.com",
                        "+91 94904 66778",
                        "Residential deep cleaning, wall painting, and doorstep two-wheeler & car care in Palamaner.",
                        7, 13.2045, 78.7490, 25.0, 4.9, 95,
                        List.of(
                                svc("cleaning", "Home Cleaning", 699),
                                svc("painting", "House Painting", 1299),
                                svc("vehicle-service", "Car & Bike Service", 449)
                        )
                ),

                // Mumbai Bandra (19.0596, 72.8295)
                buildProvider(
                        "demo-prov-bom-1",
                        "Sameer Deshmukh - WestCoast Home Care",
                        "sameer.bom@localgo.com",
                        "+91 98201 77880",
                        "Premium electrical, plumbing, and home painting solutions in Bandra, Khar, and Andheri.",
                        10, 19.0596, 72.8295, 20.0, 4.8, 154,
                        List.of(
                                svc("electrician", "Electrician", 299),
                                svc("plumber", "Plumber", 349),
                                svc("painting", "House Painting", 1599)
                        )
                ),

                // Delhi Connaught Place (28.6315, 77.2167)
                buildProvider(
                        "demo-prov-del-1",
                        "Arjun Malhotra - Capital QuickFix",
                        "arjun.del@localgo.com",
                        "+91 98100 88990",
                        "Experienced AC, laptop/mobile repair, and electrical technician serving Central & South Delhi.",
                        8, 28.6315, 77.2167, 20.0, 4.8, 131,
                        List.of(
                                svc("ac-repair", "AC Repair & Service", 499),
                                svc("computer-repair", "Computer Repair", 399),
                                svc("mobile-repair", "Mobile Repair", 299)
                        )
                )
        );
    }

    private ProviderDoc buildProvider(
            String id,
            String name,
            String email,
            String phone,
            String description,
            int experienceYears,
            double latitude,
            double longitude,
            double serviceRadiusKm,
            double rating,
            int completedJobs,
            List<ProviderServiceItem> services) {
        return ProviderDoc.builder()
                .id(id)
                .name(name)
                .email(email)
                .phone(phone)
                .description(description)
                .experienceYears(experienceYears)
                .latitude(latitude)
                .longitude(longitude)
                .serviceRadiusKm(serviceRadiusKm)
                .geohash(GeoUtils.encodeGeohash(latitude, longitude))
                .verificationStatus("VERIFIED")
                .rating(rating)
                .completedJobs(0)
                .available(false)
                .manualOffline(false)
                .services(services)
                .build();
    }

    private ProviderServiceItem svc(String serviceId, String serviceName, long priceInRupees) {
        return ProviderServiceItem.builder()
                .serviceId(serviceId)
                .serviceName(serviceName)
                .startingPrice(priceInRupees * 100L)
                .build();
    }
}
