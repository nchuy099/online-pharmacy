package com.nchuy099.SmartPharma.chat.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;

import com.nchuy099.SmartPharma.chat.service.ChatService;
import com.nchuy099.SmartPharma.common.security.CustomJwtDecoder;

class ChatStompChannelInterceptorTest {

    private static final String ACTIVE_TOPIC = "/topic/pharmacists/rooms/active";

    private ChatStompChannelInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new ChatStompChannelInterceptor(
                mock(CustomJwtDecoder.class),
                new JwtAuthenticationConverter(),
                mock(ChatService.class));
    }

    @Test
    void subscribeActiveTopicShouldAllowPharmacistRole() {
        Message<byte[]> message = buildSubscribeMessage("ROLE_PHARMACIST");

        assertDoesNotThrow(() -> interceptor.preSend(message, mock(MessageChannel.class)));
    }

    @Test
    void subscribeActiveTopicShouldRejectSuperAdminRole() {
        Message<byte[]> message = buildSubscribeMessage("ROLE_SUPER_ADMIN");

        assertThrows(IllegalArgumentException.class, () -> interceptor.preSend(message, mock(MessageChannel.class)));
    }

    private Message<byte[]> buildSubscribeMessage(String authority) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination(ACTIVE_TOPIC);
        accessor.setUser(new UsernamePasswordAuthenticationToken(
                "user-id",
                "n/a",
                List.of(new SimpleGrantedAuthority(authority))));

        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
