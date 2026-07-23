package com.nchuy099.SmartPharma.notification.strategy;

import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.notification.domain.NotificationChannel;
import com.nchuy099.SmartPharma.notification.domain.NotificationMessage;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class WebSocketNotificationStrategy implements NotificationStrategy {

    private final SimpMessagingTemplate simpMessagingTemplate;

    @Override
    public boolean supports(NotificationChannel channel) {
        return channel == NotificationChannel.WEBSOCKET;
    }

    @Override
    public void send(NotificationMessage message) {
        Map<String, Object> payload = Map.of(
                "subject", message.subject(),
                "body", message.body(),
                "payload", message.payload() != null ? message.payload() : Map.of());
        if (message.recipientUserId() != null) {
            simpMessagingTemplate.convertAndSendToUser(
                    message.recipientUserId().toString(),
                    "/queue/notifications",
                    payload);
        } else {
            simpMessagingTemplate.convertAndSend("/topic/admin/notifications", payload);
        }
    }
}
