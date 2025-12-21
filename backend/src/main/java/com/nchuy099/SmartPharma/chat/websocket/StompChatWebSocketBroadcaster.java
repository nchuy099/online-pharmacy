package com.nchuy099.SmartPharma.chat.websocket;

import org.springframework.context.annotation.Primary;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@Primary
@RequiredArgsConstructor
public class StompChatWebSocketBroadcaster implements ChatWebSocketBroadcaster {

    private final SimpMessagingTemplate simpMessagingTemplate;

    @Override
    public void broadcast(String destination, Object payload) {
        simpMessagingTemplate.convertAndSend(destination, payload);
    }
}
