package com.zidio.keystone.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends notifications on assignment and SLA breach.
 * Uses Spring's free JavaMailSender (e.g. a free Gmail/SMTP account) when
 * keystone.notifications.email-enabled=true and mail.* env vars are set.
 * Otherwise it just logs - no paid notification service is required to run KEYSTONE.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final JavaMailSender mailSender;

    @Value("${keystone.notifications.email-enabled:false}")
    private boolean emailEnabled;

    @Value("${keystone.notifications.from:no-reply@keystone.local}")
    private String from;

    public void notify(String toEmail, String subject, String body) {
        log.info("NOTIFICATION -> to={}, subject={}, body={}", toEmail, subject, body);

        if (!emailEnabled || toEmail == null || toEmail.isBlank()) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send email notification to {}: {}", toEmail, e.getMessage());
        }
    }
}
