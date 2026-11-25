package com.localgo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.localgo.enums.OtpPurpose;
import com.localgo.exception.BadRequestException;
import jakarta.mail.AuthenticationFailedException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.mail.from:}")
    private String configuredFromAddress;

    @Value("${app.mail.brevo-api-key:}")
    private String brevoApiKey;

    @Value("${app.mail.resend-api-key:}")
    private String resendApiKey;

    @Value("${app.mail.webhook-url:}")
    private String emailWebhookUrl;

    @Value("${app.dev-otp-logging:false}")
    private boolean devOtpLogging;

    public void sendOtpEmail(String toEmail, String otpCode, OtpPurpose purpose) {
        String subject = purpose == OtpPurpose.EMAIL_VERIFICATION
                ? "LocalGo — Verify Your Email Address"
                : "LocalGo — Password Reset Verification Code";

        String title = purpose == OtpPurpose.EMAIL_VERIFICATION
                ? "Verify Your Email"
                : "Reset Your Password";

        String description = purpose == OtpPurpose.EMAIL_VERIFICATION
                ? "Thank you for joining LocalGo. Use the 6-digit verification code below to complete your registration."
                : "We received a request to reset your password. Use the 6-digit verification code below to proceed.";

        String htmlContent = buildOtpEmailHtml(title, description, otpCode);
        String senderEmail = resolveSenderEmail();

        String brevoKey = firstNonBlank(brevoApiKey, System.getenv("BREVO_API_KEY"));
        if (brevoKey != null) {
            sendViaBrevo(brevoKey, senderEmail, toEmail, subject, htmlContent, otpCode, purpose);
            return;
        }

        String resendKey = firstNonBlank(resendApiKey, System.getenv("RESEND_API_KEY"));
        if (resendKey != null) {
            sendViaResend(resendKey, senderEmail, toEmail, subject, htmlContent, otpCode, purpose);
            return;
        }

        String webhook = firstNonBlank(emailWebhookUrl, System.getenv("EMAIL_WEBHOOK_URL"));
        if (webhook != null) {
            sendViaWebhook(webhook, toEmail, subject, htmlContent, otpCode, purpose);
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        boolean smtpConfigured = mailSender != null
                && fromEmail != null && !fromEmail.trim().isEmpty()
                && mailPassword != null && !mailPassword.trim().isEmpty();

        if (!smtpConfigured) {
            log.warn("Email delivery is not configured (no BREVO_API_KEY, RESEND_API_KEY, EMAIL_WEBHOOK_URL, or MAIL_USERNAME/MAIL_PASSWORD).");
            if (devOtpLogging) {
                log.info("[DEV_OTP_LOGGING] Target: {}, Purpose: {}, OTP: {}", toEmail, purpose, otpCode);
                return;
            }
            throw new BadRequestException(
                    "Email OTP delivery is not configured on the server. Please configure BREVO_API_KEY, EMAIL_WEBHOOK_URL, or MAIL_USERNAME and MAIL_PASSWORD."
            );
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(senderEmail, "LocalGo Services");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("OTP email successfully sent via SMTP to {}", toEmail);

            if (devOtpLogging) {
                log.info("[DEV_OTP_LOGGING] Target: {}, Purpose: {}, OTP: {}", toEmail, purpose, otpCode);
            }
        } catch (Exception e) {
            log.error("Failed to send OTP email via SMTP to {}: {}", toEmail, e.getMessage(), e);
            if (devOtpLogging) {
                log.info("[DEV_OTP_LOGGING FALLBACK] Target: {}, Purpose: {}, OTP: {}", toEmail, purpose, otpCode);
                return;
            }
            throw new BadRequestException(buildSmtpFailureMessage(e));
        }
    }

    private void sendViaBrevo(String apiKey, String senderEmail, String toEmail,
                              String subject, String htmlContent, String otpCode, OtpPurpose purpose) {
        if (senderEmail == null) {
            throw new BadRequestException("Please set MAIL_USERNAME or MAIL_FROM to your verified sender email for Brevo.");
        }
        try {
            Map<String, Object> payload = Map.of(
                    "sender", Map.of("name", "LocalGo Services", "email", senderEmail),
                    "to", List.of(Map.of("email", toEmail)),
                    "subject", subject,
                    "htmlContent", htmlContent
            );
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .timeout(Duration.ofSeconds(15))
                    .header("api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Brevo API returned {}: {}", response.statusCode(), response.body());
                throw new BadRequestException("Email provider error (Brevo HTTP " + response.statusCode() + "). Please verify your Brevo API key and sender email.");
            }
            log.info("OTP email successfully sent via Brevo to {}", toEmail);
            if (devOtpLogging) {
                log.info("[DEV_OTP_LOGGING] Target: {}, Purpose: {}, OTP: {}", toEmail, purpose, otpCode);
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to send OTP email via Brevo to {}: {}", toEmail, e.getMessage(), e);
            throw new BadRequestException("Failed to send verification email via Brevo: " + e.getMessage());
        }
    }

    private void sendViaResend(String apiKey, String senderEmail, String toEmail,
                               String subject, String htmlContent, String otpCode, OtpPurpose purpose) {
        String from = senderEmail != null ? "LocalGo Services <" + senderEmail + ">" : "LocalGo Services <onboarding@resend.dev>";
        try {
            Map<String, Object> payload = Map.of(
                    "from", from,
                    "to", List.of(toEmail),
                    "subject", subject,
                    "html", htmlContent
            );
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Resend API returned {}: {}", response.statusCode(), response.body());
                throw new BadRequestException("Email provider error (Resend HTTP " + response.statusCode() + "). Please verify your Resend API key and verified sender domain.");
            }
            log.info("OTP email successfully sent via Resend to {}", toEmail);
            if (devOtpLogging) {
                log.info("[DEV_OTP_LOGGING] Target: {}, Purpose: {}, OTP: {}", toEmail, purpose, otpCode);
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to send OTP email via Resend to {}: {}", toEmail, e.getMessage(), e);
            throw new BadRequestException("Failed to send verification email via Resend: " + e.getMessage());
        }
    }

    private void sendViaWebhook(String webhookUrl, String toEmail, String subject,
                                String htmlContent, String otpCode, OtpPurpose purpose) {
        try {
            Map<String, Object> payload = Map.of(
                    "to", toEmail,
                    "subject", subject,
                    "html", htmlContent,
                    "otp", otpCode,
                    "purpose", purpose.name()
            );
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Email webhook returned {}: {}", response.statusCode(), response.body());
                throw new BadRequestException("Email webhook failed with HTTP " + response.statusCode());
            }
            log.info("OTP email successfully sent via webhook to {}", toEmail);
            if (devOtpLogging) {
                log.info("[DEV_OTP_LOGGING] Target: {}, Purpose: {}, OTP: {}", toEmail, purpose, otpCode);
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to send OTP email via webhook to {}: {}", toEmail, e.getMessage(), e);
            throw new BadRequestException("Failed to send verification email via webhook: " + e.getMessage());
        }
    }

    private String buildSmtpFailureMessage(Exception e) {
        Throwable root = e;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        String combined = ((e.getMessage() != null ? e.getMessage() : "") + " " +
                (root.getMessage() != null ? root.getMessage() : "")).toLowerCase();

        if (e instanceof MailAuthenticationException || root instanceof AuthenticationFailedException
                || combined.contains("authentication failed") || combined.contains("535")) {
            return "SMTP authentication failed. Please verify MAIL_USERNAME and your Gmail App Password (MAIL_PASSWORD).";
        }
        if (combined.contains("timed out") || combined.contains("timeout")
                || combined.contains("couldn't connect") || combined.contains("connection refused")) {
            return "SMTP connection timed out (Render Free Tier blocks outbound SMTP ports 25/465/587). Set BREVO_API_KEY or EMAIL_WEBHOOK_URL on Render for HTTPS email delivery.";
        }
        return "Failed to send verification email: " + (root.getMessage() != null ? root.getMessage() : e.getMessage());
    }

    private String resolveSenderEmail() {
        return firstNonBlank(configuredFromAddress, System.getenv("MAIL_FROM"), fromEmail, System.getenv("MAIL_USERNAME"));
    }

    private String firstNonBlank(String... candidates) {
        if (candidates == null) {
            return null;
        }
        for (String c : candidates) {
            if (c != null && !c.trim().isEmpty()) {
                return c.trim();
            }
        }
        return null;
    }

    private String buildOtpEmailHtml(String title, String description, String otpCode) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }
                .brand { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; margin-bottom: 24px; }
                .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
                .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
                .otp-box { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px; }
                .otp-code { font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1e293b; }
                .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="brand">LocalGo</div>
                <div class="title">%s</div>
                <div class="text">%s</div>
                <div class="otp-box">
                  <div class="otp-code">%s</div>
                </div>
                <div class="text">This code will expire in <strong>5 minutes</strong>. If you did not request this, please ignore this email.</div>
                <div class="footer">&copy; 2026 LocalGo Services. All rights reserved.</div>
              </div>
            </body>
            </html>
            """.formatted(title, description, otpCode);
    }
}
