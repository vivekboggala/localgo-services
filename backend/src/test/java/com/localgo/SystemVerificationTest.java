package com.localgo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.google.cloud.firestore.Firestore;
import com.localgo.dto.request.BookingRequest;
import com.localgo.dto.request.ProviderRegisterRequest;
import com.localgo.dto.request.StatusUpdateRequest;
import com.localgo.dto.response.BookingResponse;
import com.localgo.dto.response.EarningsTrendResponse;
import com.localgo.dto.response.ProviderResponse;
import com.localgo.enums.BookingStatus;
import com.localgo.exception.BookingConflictException;
import com.localgo.service.AuthService;
import com.localgo.service.BookingService;
import com.localgo.service.FavoriteService;
import com.localgo.service.ProviderDashboardService;
import com.localgo.service.ProviderService;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.File;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class SystemVerificationTest {

    @BeforeAll
    static void requireFirebaseCredentials() {
        boolean hasCreds = (System.getenv("FIREBASE_CREDENTIALS_JSON") != null && !System.getenv("FIREBASE_CREDENTIALS_JSON").isBlank())
                || (System.getenv("FIREBASE_CREDENTIALS_PATH") != null && !System.getenv("FIREBASE_CREDENTIALS_PATH").isBlank())
                || (System.getenv("APP_FIREBASE_CREDENTIAL_PATH") != null && !System.getenv("APP_FIREBASE_CREDENTIAL_PATH").isBlank())
                || new File("src/main/resources/localgo-824dd-firebase-adminsdk-fbsvc-274cd5adb8.json").exists();
        Assumptions.assumeTrue(hasCreds, "Skipping live Firestore integration suite without Firebase credentials");
    }

    @Autowired
    private Firestore firestore;

    @Autowired
    private AuthService authService;

    @Autowired
    private ProviderService providerService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private ProviderDashboardService providerDashboardService;

    @Autowired
    private FavoriteService favoriteService;

    private static final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .enable(SerializationFeature.INDENT_OUTPUT);

    private static final String TEST_PROVIDER_UID = "prov_verify_101";
    private static final String TEST_CUSTOMER_UID = "cust_verify_202";

    @Test
    @Order(1)
    public void verifyNearbyGeoSearch() throws Exception {
        System.out.println("\n=======================================================");
        System.out.println("VERIFICATION 1: REAL FIRESTORE GEO SEARCH (3a)");
        System.out.println("=======================================================");

        // Register a real test provider in Firestore
        ProviderRegisterRequest req = new ProviderRegisterRequest();
        req.setUid(TEST_PROVIDER_UID);
        req.setName("Suresh Electricals & AC");
        req.setEmail("suresh.verify@example.com");
        req.setPhone("+919876543210");
        req.setDescription("Expert AC maintenance and electrical installations");
        req.setExperienceYears(8);
        req.setLatitude(17.385044); // Hyderabad coordinates
        req.setLongitude(78.486671);
        req.setServiceRadiusKm(15.0);
        req.setPrimaryServiceId("ac-repair");
        req.setStartingPrice(499.0); // 499 INR = 49900 paise

        authService.registerProvider(req, TEST_PROVIDER_UID);
        firestore.collection("providers").document(TEST_PROVIDER_UID).update("verificationStatus", "VERIFIED").get();
        providerDashboardService.updatePresence(TEST_PROVIDER_UID, true, true);

        // Perform real nearby search around Hyderabad (center: 17.3870, 78.4900, radius 10 km)
        List<ProviderResponse> searchResults = providerService.findNearbyProviders(
                17.3870, 78.4900, 10.0, "ac-repair", 0.0, null, true, "distance"
        );

        System.out.println("Search Center: (17.3870, 78.4900) with radius: 10.0 km");
        System.out.println("Actual Firestore Query Results Count: " + searchResults.size());
        System.out.println("Returned JSON from real Firestore query:");
        System.out.println(mapper.writeValueAsString(searchResults));

        assertFalse(searchResults.isEmpty(), "Expected at least 1 provider returned from Firestore");
        assertTrue(searchResults.stream().anyMatch(p -> TEST_PROVIDER_UID.equals(p.getId())),
                "Expected Suresh Electricals to be found in search results");
    }

    @Test
    @Order(2)
    public void verifyBookingConflictDetection() throws Exception {
        System.out.println("\n=======================================================");
        System.out.println("VERIFICATION 2: TRANSACTION BOOKING CONFLICT DETECTION (3b)");
        System.out.println("=======================================================");

        LocalDate conflictDate = LocalDate.now().plusDays(15); // Unique distinct future date

        // Clean up any existing bookings for TEST_PROVIDER_UID on conflictDate
        var existingBookings = firestore.collection("bookings")
                .whereEqualTo("providerId", TEST_PROVIDER_UID)
                .whereEqualTo("scheduledDate", conflictDate.toString())
                .get().get();
        for (var doc : existingBookings.getDocuments()) {
            firestore.collection("bookings").document(doc.getId()).delete().get();
        }

        // 1. Create first booking: 10:00 to 11:00 (duration: 60 mins)
        BookingRequest booking1 = new BookingRequest();
        booking1.setProviderId(TEST_PROVIDER_UID);
        booking1.setServiceId("ac-repair");
        booking1.setDescription("Deep AC cleaning slot 1");
        booking1.setLatitude(17.3860);
        booking1.setLongitude(78.4870);
        booking1.setAddress("Flat 401, Pearl Residency, Abids");
        booking1.setScheduledDate(conflictDate);
        booking1.setScheduledTime(LocalTime.of(10, 0));
        booking1.setEstimatedDurationMins(60);
        booking1.setPaymentMethod("UPI");
        booking1.setAmount(499.0);

        BookingResponse created1 = bookingService.createBooking(booking1, TEST_CUSTOMER_UID);
        System.out.println("Booking 1 created successfully with ID: " + created1.getId() +
                " for slot: " + created1.getScheduledTime() + " (duration: " + created1.getEstimatedDurationMins() + " mins)");

        // Transition Booking 1 to ACCEPTED so it becomes an active slot
        StatusUpdateRequest acceptReq = new StatusUpdateRequest();
        acceptReq.setStatus(BookingStatus.ACCEPTED);
        bookingService.updateBookingStatus(created1.getId(), acceptReq, TEST_PROVIDER_UID);
        System.out.println("Booking 1 status updated to ACCEPTED in Firestore.");

        // 2. Attempt second booking with OVERLAPPING time slot: 10:30 to 11:30 (overlap with 10:00 - 11:00)
        BookingRequest booking2 = new BookingRequest();
        booking2.setProviderId(TEST_PROVIDER_UID);
        booking2.setServiceId("ac-repair");
        booking2.setDescription("Concurrent conflicting AC booking");
        booking2.setLatitude(17.3870);
        booking2.setLongitude(78.4880);
        booking2.setAddress("Banjara Hills Road 12");
        booking2.setScheduledDate(conflictDate);
        booking2.setScheduledTime(LocalTime.of(10, 30)); // OVERLAPS!
        booking2.setEstimatedDurationMins(60);
        booking2.setPaymentMethod("CASH");
        booking2.setAmount(499.0);

        System.out.println("Attempting overlapping Booking 2 for slot: 10:30 on same date...");

        boolean conflictCaught = false;
        try {
            bookingService.createBooking(booking2, "another_customer_303");
        } catch (BookingConflictException ex) {
            conflictCaught = true;
            System.out.println(">>> SUCCESS: Overlapping booking GENUINELY REJECTED by Firestore transaction! <<<");
            System.out.println("Exception message: " + ex.getMessage());
        }

        assertTrue(conflictCaught, "Expected BookingConflictException to be thrown for overlapping slot");
    }

    @Test
    @Order(3)
    public void verifyEarningsTrendAggregationAndZeroFill() throws Exception {
        System.out.println("\n=======================================================");
        System.out.println("VERIFICATION 3: EARNINGS-TREND AGGREGATION & ZERO-FILL (3c)");
        System.out.println("=======================================================");

        LocalDate today = LocalDate.now();
        LocalDate targetActiveDate = today.minusDays(2); // Activity on day -2

        // Clean up any existing bookings for TEST_PROVIDER_UID so prior runs don't contaminate revenue totals
        var existingTrendBookings = firestore.collection("bookings")
                .whereEqualTo("providerId", TEST_PROVIDER_UID)
                .get().get();
        for (var doc : existingTrendBookings.getDocuments()) {
            firestore.collection("bookings").document(doc.getId()).delete().get();
        }

        // Create completed paid booking on targetActiveDate
        BookingRequest bookingReq = new BookingRequest();
        bookingReq.setProviderId(TEST_PROVIDER_UID);
        bookingReq.setServiceId("ac-repair");
        bookingReq.setDescription("Completed AC service for revenue check");
        bookingReq.setLatitude(17.3860);
        bookingReq.setLongitude(78.4870);
        bookingReq.setAddress("Test Address");
        bookingReq.setScheduledDate(today); // Valid for request
        bookingReq.setScheduledTime(LocalTime.of(14, 0));
        bookingReq.setPaymentMethod("UPI");
        bookingReq.setAmount(850.0); // 850 INR = 85000 paise

        BookingResponse bResp = bookingService.createBooking(bookingReq, TEST_CUSTOMER_UID);

        // Update directly in Firestore to mark as COMPLETED on targetActiveDate with 85000 paise
        var bRef = firestore.collection("bookings").document(bResp.getId());
        bRef.update("status", "COMPLETED",
                    "paymentStatus", "PAID",
                    "scheduledDate", targetActiveDate.toString(),
                    "amount", 85000L).get();

        // Call the earnings trend endpoint for 7 days
        List<EarningsTrendResponse> trend = providerDashboardService.getProviderEarningsTrend(TEST_PROVIDER_UID, 7);

        System.out.println("Actual JSON Response from Firestore earnings-trend endpoint (7-day window):");
        System.out.println(mapper.writeValueAsString(trend));

        assertEquals(7, trend.size(), "Trend must contain exactly 7 continuous days");

        // Verify that targetActiveDate has 850.00 INR and others are zero-filled
        boolean foundActiveDay = false;
        boolean foundZeroDay = false;

        for (EarningsTrendResponse day : trend) {
            if (day.getDate().equals(targetActiveDate)) {
                foundActiveDay = true;
                assertEquals(850.0, day.getEarnings().doubleValue(), 0.01, "Expected 850.00 INR on active day");
                assertEquals(1, day.getCompletedBookings());
            } else {
                if (day.getEarnings().doubleValue() == 0.0 && day.getCompletedBookings() == 0) {
                    foundZeroDay = true;
                }
            }
        }

        assertTrue(foundActiveDay, "Active day with revenue must be present");
        assertTrue(foundZeroDay, "Zero-activity days must be zero-filled without gaps");
    }

    @Test
    @Order(4)
    public void verifyFavoritesUniqueness() throws Exception {
        System.out.println("\n=======================================================");
        System.out.println("VERIFICATION 4: FAVORITES COMPOSITE-ID UNIQUENESS (3d)");
        System.out.println("=======================================================");

        String customerId = "cust_fav_test";
        String providerId = TEST_PROVIDER_UID;
        String expectedDocId = customerId + "_" + providerId;

        // First POST
        favoriteService.addFavorite(customerId, providerId);
        var doc1 = firestore.collection("favorites").document(expectedDocId).get().get();

        System.out.println("After 1st addFavorite POST:");
        System.out.println("Document ID: " + doc1.getId() + " exists: " + doc1.exists());
        System.out.println("Document Data: " + doc1.getData());
        assertTrue(doc1.exists(), "Favorite composite document must exist");

        // Second POST with identical customerId and providerId
        favoriteService.addFavorite(customerId, providerId);
        var doc2 = firestore.collection("favorites").document(expectedDocId).get().get();

        System.out.println("After 2nd identical addFavorite POST:");
        System.out.println("Document ID: " + doc2.getId() + " exists: " + doc2.exists());

        // Query all favorites for customer to prove zero duplicates
        var allFavorites = firestore.collection("favorites")
                .whereEqualTo("customerId", customerId)
                .get().get();

        System.out.println("Total favorite documents for " + customerId + ": " + allFavorites.size());
        assertEquals(1, allFavorites.size(), "Must be exactly 1 favorite document (no duplicates)");

        // Verify isFavorite and delete
        assertTrue(favoriteService.isFavorite(customerId, providerId));
        favoriteService.removeFavorite(customerId, providerId);
        assertFalse(favoriteService.isFavorite(customerId, providerId));
        System.out.println("Favorite successfully removed and verified.");
    }

    @Test
    @Order(5)
    public void verifyBookingStartAndCompletionOtp() throws Exception {
        System.out.println("\n=======================================================");
        System.out.println("VERIFICATION 5: BOOKING START & COMPLETION OTP WORKFLOW");
        System.out.println("=======================================================");

        LocalDate otpTestDate = LocalDate.now().plusDays(25);
        var existing = firestore.collection("bookings")
                .whereEqualTo("providerId", TEST_PROVIDER_UID)
                .whereEqualTo("scheduledDate", otpTestDate.toString())
                .get().get();
        for (var doc : existing.getDocuments()) {
            firestore.collection("bookings").document(doc.getId()).delete().get();
        }

        BookingRequest req = new BookingRequest();
        req.setProviderId(TEST_PROVIDER_UID);
        req.setServiceId("ac-repair");
        req.setDescription("OTP-verified AC servicing");
        req.setLatitude(17.3860);
        req.setLongitude(78.4870);
        req.setAddress("Flat 101, Jubilee Hills");
        req.setScheduledDate(otpTestDate);
        req.setScheduledTime(LocalTime.of(16, 0));
        req.setEstimatedDurationMins(60);
        req.setPaymentMethod("CASH");
        req.setAmount(499.0);

        BookingResponse customerBooking = bookingService.createBooking(req, TEST_CUSTOMER_UID);
        assertNotNull(customerBooking.getStartOtp());
        assertEquals(4, customerBooking.getStartOtp().length());
        assertNull(customerBooking.getCompletionOtp());

        // Provider view must NOT expose customer OTP
        BookingResponse providerView = bookingService.getBookingById(customerBooking.getId(), TEST_PROVIDER_UID);
        assertNull(providerView.getStartOtp(), "Provider must not see startOtp from API");
        assertNull(providerView.getCompletionOtp(), "Provider must not see completionOtp from API");

        // Transition ACCEPTED -> ON_THE_WAY -> ARRIVED
        StatusUpdateRequest step = new StatusUpdateRequest();
        step.setStatus(BookingStatus.ACCEPTED);
        bookingService.updateBookingStatus(customerBooking.getId(), step, TEST_PROVIDER_UID);
        step.setStatus(BookingStatus.ON_THE_WAY);
        bookingService.updateBookingStatus(customerBooking.getId(), step, TEST_PROVIDER_UID);
        step.setStatus(BookingStatus.ARRIVED);
        bookingService.updateBookingStatus(customerBooking.getId(), step, TEST_PROVIDER_UID);

        // Wrong Start OTP must be rejected
        StatusUpdateRequest startWrong = new StatusUpdateRequest();
        startWrong.setStatus(BookingStatus.IN_PROGRESS);
        startWrong.setOtp("0000".equals(customerBooking.getStartOtp()) ? "1111" : "0000");
        assertThrows(com.localgo.exception.BadRequestException.class,
                () -> bookingService.updateBookingStatus(customerBooking.getId(), startWrong, TEST_PROVIDER_UID));

        // Valid Start OTP succeeds
        StatusUpdateRequest startValid = new StatusUpdateRequest();
        startValid.setStatus(BookingStatus.IN_PROGRESS);
        startValid.setOtp(customerBooking.getStartOtp());
        BookingResponse inProgressResp = bookingService.updateBookingStatus(customerBooking.getId(), startValid, TEST_PROVIDER_UID);
        assertEquals(BookingStatus.IN_PROGRESS, inProgressResp.getStatus());

        // Completion succeeds directly without a second OTP
        StatusUpdateRequest completeDirect = new StatusUpdateRequest();
        completeDirect.setStatus(BookingStatus.COMPLETED);
        BookingResponse completedResp = bookingService.updateBookingStatus(customerBooking.getId(), completeDirect, TEST_PROVIDER_UID);
        assertEquals(BookingStatus.COMPLETED, completedResp.getStatus());
        System.out.println(">>> Booking single Start OTP workflow verified end-to-end! <<<");
    }
}
