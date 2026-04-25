package com.nchuy099.SmartPharma.flashsale.config;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class FlashSaleWebSocketBroadcaster {

    private final SimpMessagingTemplate simpMessagingTemplate;

    public void broadcast(String destination, Object payload) {
        simpMessagingTemplate.convertAndSend(destination, payload);
    }
}
