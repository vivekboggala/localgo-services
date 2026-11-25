package com.localgo;

import com.localgo.enums.OtpPurpose;
import com.localgo.exception.BadRequestException;
import com.localgo.service.EmailService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import com.sun.net.httpserver.HttpServer;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmailServiceTest {

    @SuppressWarnings("unchecked")
    private EmailService createService(JavaMailSender mailSender) {
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(mailSender);
        EmailService service = new EmailService(provider);
        ReflectionTestUtils.setField(service, "fromEmail", "sender@example.com");
        ReflectionTestUtils.setField(service, "mailPassword", "app-password");
        ReflectionTestUtils.setField(service, "devOtpLogging", false);
        return service;
    }

    @Test
    void surfacesTimeoutDiagnosticWhenSmtpBlocked() {
        JavaMailSender sender = mock(JavaMailSender.class);
        when(sender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
        doThrow(new MailSendException("Mail server connection failed", new SocketTimeoutException("connect timed out")))
                .when(sender).send(any(MimeMessage.class));

        EmailService service = createService(sender);
        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> service.sendOtpEmail("user@example.com", "123456", OtpPurpose.EMAIL_VERIFICATION)
        );
        assertTrue(ex.getMessage().contains("Render Free Tier blocks outbound SMTP"));
    }

    @Test
    void surfacesAuthDiagnosticWhenCredentialsRejected() {
        JavaMailSender sender = mock(JavaMailSender.class);
        when(sender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
        doThrow(new MailAuthenticationException("Authentication failed"))
                .when(sender).send(any(MimeMessage.class));

        EmailService service = createService(sender);
        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> service.sendOtpEmail("user@example.com", "123456", OtpPurpose.EMAIL_VERIFICATION)
        );
        assertTrue(ex.getMessage().contains("SMTP authentication failed"));
    }

    @Test
    void rejectsWebhookHtmlLoginPageEvenOnHttp200() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/exec", exchange -> {
            byte[] body = "<!DOCTYPE html><html><body>Sign in - accounts.google.com</body></html>"
                    .getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        });
        server.start();
        try {
            EmailService service = createService(null);
            ReflectionTestUtils.setField(service, "emailWebhookUrl",
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/exec");
            BadRequestException ex = assertThrows(
                    BadRequestException.class,
                    () -> service.sendOtpEmail("user@example.com", "123456", OtpPurpose.EMAIL_VERIFICATION)
            );
            assertTrue(ex.getMessage().contains("Google sign-in"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    void acceptsWebhookPlainOkResponse() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/exec", exchange -> {
            byte[] body = "OK".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        });
        server.start();
        try {
            EmailService service = createService(null);
            ReflectionTestUtils.setField(service, "emailWebhookUrl",
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/exec");
            assertDoesNotThrow(() ->
                    service.sendOtpEmail("user@example.com", "123456", OtpPurpose.EMAIL_VERIFICATION));
        } finally {
            server.stop(0);
        }
    }
}
