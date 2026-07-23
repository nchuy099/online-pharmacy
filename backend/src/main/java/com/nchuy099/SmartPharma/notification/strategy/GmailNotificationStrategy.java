package com.nchuy099.SmartPharma.notification.strategy;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.nchuy099.SmartPharma.notification.domain.NotificationChannel;
import com.nchuy099.SmartPharma.notification.domain.NotificationMessage;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnBean(JavaMailSender.class)
public class GmailNotificationStrategy implements NotificationStrategy {

    private final JavaMailSender mailSender;

    @Value("${notification.gmail.from:}")
    private String from;

    @Override
    public boolean supports(NotificationChannel channel) {
        return channel == NotificationChannel.GMAIL;
    }

    @Override
    public void send(NotificationMessage message) {
        if (!StringUtils.hasText(message.recipientEmail())) {
            log.debug("Skip Gmail notification without recipient email: {}", message.subject());
            return;
        }
        if (!StringUtils.hasText(from)) {
            log.warn("Skip Gmail notification because notification.gmail.from is not configured");
            return;
        }
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            mimeMessage.setFrom(from);
            mimeMessage.setRecipients(MimeMessage.RecipientType.TO, message.recipientEmail());
            mimeMessage.setSubject(message.subject(), "UTF-8");
            mimeMessage.setText(message.body(), "UTF-8");
            mailSender.send(mimeMessage);
        } catch (Exception ex) {
            log.error("Failed to send Gmail notification to {}", message.recipientEmail(), ex);
        }
    }
}
