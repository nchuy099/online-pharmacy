package com.nchuy099.SmartPharma.chat.websocket;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

class StompChatWebSocketBroadcasterTest {

    @Test
    void broadcastShouldDelegateToSimpMessagingTemplate() {
        SimpMessagingTemplate template = mock(SimpMessagingTemplate.class);
        StompChatWebSocketBroadcaster broadcaster = new StompChatWebSocketBroadcaster(template);

        Object payload = new Object();
        broadcaster.broadcast("/topic/chat/room-1", payload);

        verify(template).convertAndSend("/topic/chat/room-1", payload);
    }
}
