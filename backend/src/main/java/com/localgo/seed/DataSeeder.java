package com.localgo.seed;

import com.google.cloud.firestore.Firestore;
import com.localgo.model.ProviderDoc;
import com.localgo.model.ProviderServiceItem;
import com.localgo.model.ServiceDoc;
import com.localgo.util.GeoUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private static final String DEMO_MARKER_PROVIDER_ID = "demo-prov-blr-elec-1";

    private final Firestore firestore;

    @Override
    public void run(String... args) throws Exception {
        seedServices();
        seedDemoProviders();
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
        var markerSnap = providersCollection.document(DEMO_MARKER_PROVIDER_ID).get().get();

        if (markerSnap.exists()) {
            log.info("Demo providers already seeded in Firestore.");
            return;
        }

        List<ProviderDoc> demoProviders = buildDemoProviders();
        for (ProviderDoc provider : demoProviders) {
            providersCollection.document(provider.getId()).set(provider).get();
        }
        log.info("Seeded {} verified demo providers into Firestore successfully.", demoProviders.size());
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
                .completedJobs(completedJobs)
                .available(true)
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
