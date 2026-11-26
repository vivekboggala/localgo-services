package com.localgo;

import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.localgo.dto.request.ForgotPasswordRequest;
import com.localgo.dto.request.RegisterRequest;
import com.localgo.dto.request.ResendOtpRequest;
import com.localgo.dto.request.ResetPasswordRequest;
import com.localgo.dto.request.VerifyOtpRequest;
import com.localgo.dto.response.AuthResponse;
import com.localgo.enums.OtpPurpose;
import com.localgo.exception.BadRequestException;
import com.localgo.model.OtpDoc;
import com.localgo.model.UserDoc;
import com.localgo.service.AuthService;
import com.localgo.service.EmailService;
import com.localgo.service.OtpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpAuthFlowTest {

    @Mock
    private Firestore firestore;

    @Mock
    private FirebaseAuth firebaseAuth;

    @Mock
    private EmailService emailService;

    @Mock
    private CollectionReference otpCollection;

    @Mock
    private CollectionReference usersCollection;

    private final Map<String, OtpDoc> otpStore = new ConcurrentHashMap<>();

    private OtpService otpService;
    private AuthService authService;

    @BeforeEach
    void setUp() throws Exception {
        otpStore.clear();
        otpService = new OtpService(firestore, emailService);
        authService = new AuthService(firestore, firebaseAuth, otpService);

        lenient().when(firestore.collection("otp_verifications")).thenReturn(otpCollection);
        lenient().when(firestore.collection("users")).thenReturn(usersCollection);

        lenient().when(otpCollection.document(anyString())).thenAnswer(inv -> {
            String docId = inv.getArgument(0);
            DocumentReference docRef = mock(DocumentReference.class);
            lenient().when(docRef.getId()).thenReturn(docId);
            lenient().when(docRef.get()).thenAnswer(g -> {
                DocumentSnapshot snap = mock(DocumentSnapshot.class);
                OtpDoc stored = otpStore.get(docId);
                when(snap.exists()).thenReturn(stored != null);
                lenient().when(snap.toObject(OtpDoc.class)).thenReturn(stored);
                return ApiFutures.immediateFuture(snap);
            });
            lenient().when(docRef.set(any(OtpDoc.class))).thenAnswer(s -> {
                OtpDoc doc = s.getArgument(0);
                otpStore.put(docId, doc);
                return ApiFutures.immediateFuture(null);
            });
            return docRef;
        });
    }

    @Test
    void registrationIsBlockedWithoutVerifiedOtp() {
        RegisterRequest req = new RegisterRequest();
        req.setUid("uid-123");
        req.setName("Test User");
        req.setEmail("newuser@example.com");
        req.setPhone("9876543210");
        req.setPassword("secret123");

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> authService.registerCustomerWithOtp(req, "uid-123")
        );
        assertTrue(ex.getMessage().contains("Email verification is required"));
    }

    @Test
    void fullOtpVerificationEnablesRegistrationOnce() throws Exception {
        String email = "verified.user@example.com";

        FirebaseAuthException notFoundEx = mock(FirebaseAuthException.class);
        when(firebaseAuth.getUserByEmail(email)).thenThrow(notFoundEx);

        Query query = mock(Query.class);
        Query limitedQuery = mock(Query.class);
        QuerySnapshot emptySnap = mock(QuerySnapshot.class);
        when(usersCollection.whereEqualTo("email", email)).thenReturn(query);
        when(query.limit(1)).thenReturn(limitedQuery);
        when(limitedQuery.get()).thenReturn(ApiFutures.immediateFuture(emptySnap));
        when(emptySnap.getDocuments()).thenReturn(Collections.emptyList());

        ResendOtpRequest sendReq = new ResendOtpRequest();
        sendReq.setEmail(email);
        sendReq.setPurpose(OtpPurpose.EMAIL_VERIFICATION);
        authService.sendOtp(sendReq);

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendOtpEmail(eq(email), otpCaptor.capture(), eq(OtpPurpose.EMAIL_VERIFICATION));
        String sentOtp = otpCaptor.getValue();
        assertEquals(6, sentOtp.length());

        // Wrong OTP fails
        VerifyOtpRequest wrongReq = new VerifyOtpRequest();
        wrongReq.setEmail(email);
        wrongReq.setOtp("000000".equals(sentOtp) ? "111111" : "000000");
        wrongReq.setPurpose(OtpPurpose.EMAIL_VERIFICATION);
        assertThrows(BadRequestException.class, () -> authService.verifyEmailOtp(wrongReq));

        // Correct OTP succeeds and returns verification token
        VerifyOtpRequest validReq = new VerifyOtpRequest();
        validReq.setEmail(email);
        validReq.setOtp(sentOtp);
        validReq.setPurpose(OtpPurpose.EMAIL_VERIFICATION);
        Map<String, Object> verifyResult = authService.verifyEmailOtp(validReq);
        assertEquals(true, verifyResult.get("verified"));
        String token = (String) verifyResult.get("verificationToken");
        assertNotNull(token);

        // Register with verified token succeeds
        DocumentReference userDocRef = mock(DocumentReference.class);
        when(usersCollection.document("uid-verified")).thenReturn(userDocRef);
        when(userDocRef.set(any(UserDoc.class))).thenReturn(ApiFutures.immediateFuture(null));

        RegisterRequest regReq = new RegisterRequest();
        regReq.setUid("uid-verified");
        regReq.setName("Verified User");
        regReq.setEmail(email);
        regReq.setPhone("9876543210");
        regReq.setPassword("secret123");
        regReq.setOtpVerificationToken(token);

        AuthResponse response = authService.registerCustomerWithOtp(regReq, "uid-verified");
        assertNotNull(response.getUser());
        assertTrue(Boolean.TRUE.equals(response.getUser().getEmailVerified()));

        // Reusing the same verification token is rejected
        assertThrows(BadRequestException.class, () -> authService.registerCustomerWithOtp(regReq, "uid-verified"));
    }

    @Test
    void twoStepPasswordResetRequiresVerifiedOtpThenConsumesTokenOnce() throws Exception {
        String email = "reset.user@example.com";
        UserRecord record = mock(UserRecord.class);
        when(record.getUid()).thenReturn("uid-reset");
        when(firebaseAuth.getUserByEmail(email)).thenReturn(record);

        ForgotPasswordRequest forgotReq = new ForgotPasswordRequest();
        forgotReq.setEmail(email);
        authService.forgotPassword(forgotReq);

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendOtpEmail(eq(email), otpCaptor.capture(), eq(OtpPurpose.PASSWORD_RESET));
        String otp = otpCaptor.getValue();

        VerifyOtpRequest verifyReq = new VerifyOtpRequest();
        verifyReq.setEmail(email);
        verifyReq.setOtp(otp);
        verifyReq.setPurpose(OtpPurpose.PASSWORD_RESET);

        Map<String, Object> verifyResp = authService.verifyPasswordResetOtp(verifyReq);
        assertEquals(true, verifyResp.get("verified"));
        String resetToken = (String) verifyResp.get("verificationToken");
        assertNotNull(resetToken);

        ResetPasswordRequest resetReq = new ResetPasswordRequest();
        resetReq.setEmail(email);
        resetReq.setVerificationToken(resetToken);
        resetReq.setNewPassword("NewPass@123");

        authService.resetPassword(resetReq);
        verify(firebaseAuth).updateUser(any(UserRecord.UpdateRequest.class));

        // Reset token cannot be reused twice
        assertThrows(BadRequestException.class, () -> authService.resetPassword(resetReq));
    }
}
