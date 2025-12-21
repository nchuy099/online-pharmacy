package com.nchuy099.SmartPharma.chat.websocket;

public interface ChatWebSocketBroadcaster {
    void broadcast(String destination, Object payload);
}
