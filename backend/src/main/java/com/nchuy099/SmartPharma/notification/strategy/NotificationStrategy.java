package com.nchuy099.SmartPharma.notification.strategy;

import com.nchuy099.SmartPharma.notification.domain.NotificationChannel;
import com.nchuy099.SmartPharma.notification.domain.NotificationMessage;

public interface NotificationStrategy {
    boolean supports(NotificationChannel channel);

    void send(NotificationMessage message);
}
