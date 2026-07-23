package com.nchuy099.SmartPharma.notification.domain;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

import lombok.Builder;

@Builder
public record NotificationMessage(
        UUID recipientUserId,
        String recipientEmail,
        String subject,
        String body,
        Map<String, Object> payload,
        Set<NotificationChannel> channels) {
}
