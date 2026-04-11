package com.scholarship.platform.service;

import com.scholarship.platform.model.User;
import com.scholarship.platform.util.Constants;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.nio.charset.StandardCharsets;

/**
 * Sends HTML emails using Thymeleaf templates and Spring Mail.
 * All sending methods are {@link Async} to avoid blocking request threads.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender       mailSender;

    @Qualifier("emailTemplateEngine")
    private final SpringTemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    // ── Public API ─────────────────────────────────────────────────────────────

    @Async
    public void sendVerificationEmail(User user) {
        sendVerificationEmail(user, null);
    }

    @Async
    public void sendVerificationEmail(User user, String frontendBaseUrl) {
        Context ctx = new Context();
        ctx.setVariable("name",  user.getFullName());
        ctx.setVariable("token", user.getVerificationToken());
        ctx.setVariable("verifyUrl", resolveFrontendUrl(frontendBaseUrl)
                + "/verify-email?token=" + user.getVerificationToken());

        sendHtmlEmail(user.getEmail(), "Verify your ScholarMatch AI account",
                      Constants.EMAIL_TEMPLATE_VERIFY, ctx);
    }

    @Async
    public void sendPasswordResetEmail(User user, String token) {
        sendPasswordResetEmail(user, token, null);
    }

    @Async
    public void sendPasswordResetEmail(User user, String token, String frontendBaseUrl) {
        Context ctx = new Context();
        ctx.setVariable("name",     user.getFullName());
        ctx.setVariable("resetUrl", resolveFrontendUrl(frontendBaseUrl) + "/reset-password?token=" + token);

        sendHtmlEmail(user.getEmail(), "Reset your ScholarMatch AI password",
                      Constants.EMAIL_TEMPLATE_RESET_PWD, ctx);
    }

    @Async
    public void sendApplicationStatusEmail(User user, String scholarshipName,
                                           String status) {
        Context ctx = new Context();
        ctx.setVariable("name",            user.getFullName());
        ctx.setVariable("scholarshipName", scholarshipName);
        ctx.setVariable("status",          status);

        sendHtmlEmail(user.getEmail(),
                      "Application Update – " + scholarshipName,
                      Constants.EMAIL_TEMPLATE_APP_STATUS, ctx);
    }

    @Async
    public void sendDeadlineReminderEmail(User user, String scholarshipName,
                                          String applicationUrl, long daysLeft) {
        Context ctx = new Context();
        ctx.setVariable("name",            user.getFullName());
        ctx.setVariable("scholarshipName", scholarshipName);
        ctx.setVariable("daysLeft",        daysLeft);
        ctx.setVariable("applyUrl",        applicationUrl);

        sendHtmlEmail(user.getEmail(),
                      "Reminder: " + scholarshipName + " deadline in " + daysLeft + " day(s)",
                      Constants.EMAIL_TEMPLATE_DEADLINE, ctx);
    }

    // ── Core send ──────────────────────────────────────────────────────────────

    private void sendHtmlEmail(String to, String subject, String templateName, Context ctx) {
        try {
            if (!isMailConfigured()) {
                log.warn("SMTP not configured with real credentials. Skipping send for {} subject='{}'",
                        to, subject);
                logFallbackDetails(subject, to, ctx);
                return;
            }

            String html = templateEngine.process(templateName, ctx);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail, "ScholarMatch AI");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Email '{}' sent to {}", subject, to);
        } catch (Exception ex) {
            log.error("Failed to send email to {}: {}", to, ex.getMessage());
            logFallbackDetails(subject, to, ctx);
        }
    }

    private boolean isMailConfigured() {
        if (fromEmail == null || fromEmail.isBlank() || mailPassword == null || mailPassword.isBlank()) {
            return false;
        }

        return !("noreply@scholarmatch.ai".equalsIgnoreCase(fromEmail.trim())
                && "changeme".equals(mailPassword));
    }

    private String resolveFrontendUrl(String frontendBaseUrl) {
        String candidate = frontendBaseUrl;
        if (candidate == null || candidate.isBlank()) {
            candidate = frontendUrl;
        }
        if (candidate == null || candidate.isBlank()) {
            candidate = "http://localhost:5173";
        }
        return candidate.endsWith("/") ? candidate.substring(0, candidate.length() - 1) : candidate;
    }

    private void logFallbackDetails(String subject, String to, Context ctx) {
        Object token = ctx.getVariable("token");
        Object verifyUrl = ctx.getVariable("verifyUrl");
        Object resetUrl = ctx.getVariable("resetUrl");

        if (verifyUrl != null || token != null) {
            log.warn("Email fallback for {} subject='{}' verifyUrl={} token={}",
                    to, subject, verifyUrl, token);
            return;
        }

        if (resetUrl != null) {
            log.warn("Email fallback for {} subject='{}' resetUrl={}",
                    to, subject, resetUrl);
        }
    }
}
