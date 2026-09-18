package com.localgo.service;

import com.localgo.enums.OtpPurpose;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

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

        try {
            if (fromEmail == null || fromEmail.trim().isEmpty()) {
                log.warn("Gmail SMTP username is not configured (MAIL_USERNAME is empty).");
                if (devOtpLogging) {
                    log.info("[DEV_OTP_LOGGING] Target: {}, Purpose: {}, OTP: {}", toEmail, purpose, otpCode);
                }
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "LocalGo Services");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("OTP email successfully sent to {}", toEmail);

            if (devOtpLogging) {
                log.info("[DEV_OTP_LOGGING] Target: {}, Purpose: {}, OTP: {}", toEmail, purpose, otpCode);
            }
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            if (devOtpLogging) {
                log.info("[DEV_OTP_LOGGING FALLBACK] Target: {}, Purpose: {}, OTP: {}", toEmail, purpose, otpCode);
            }
        }
    }

    private String buildOtpEmailHtml(String title, String description, String otpCode) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
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
