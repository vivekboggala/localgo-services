package com.localgo.seed;

import com.google.cloud.firestore.Firestore;
import com.localgo.model.ServiceDoc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final Firestore firestore;

    @Override
    public void run(String... args) throws Exception {
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
}
