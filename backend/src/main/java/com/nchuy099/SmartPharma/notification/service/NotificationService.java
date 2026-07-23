package com.nchuy099.SmartPharma.notification.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.notification.domain.NotificationMessage;
import com.nchuy099.SmartPharma.notification.strategy.NotificationStrategy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final List<NotificationStrategy> strategies;

    public void send(NotificationMessage message) {
        if (message == null || message.channels() == null || message.channels().isEmpty()) {
            return;
        }
        for (var channel : message.channels()) {
            strategies.stream()
                    .filter(strategy -> strategy.supports(channel))
                    .forEach(strategy -> {
                        try {
                            strategy.send(message);
                        } catch (RuntimeException ex) {
                            log.error("Notification strategy {} failed for {}", strategy.getClass().getSimpleName(),
                                    message.subject(), ex);
                        }
                    });
        }
    }
}
