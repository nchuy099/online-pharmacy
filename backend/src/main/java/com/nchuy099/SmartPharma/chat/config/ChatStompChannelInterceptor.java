package com.nchuy099.SmartPharma.chat.config;

import java.security.Principal;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.chat.service.ChatService;
import com.nchuy099.SmartPharma.common.security.CustomJwtDecoder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatStompChannelInterceptor implements ChannelInterceptor {

    private static final String TOPIC_CHAT_PREFIX = "/topic/chat/";
    private static final String APP_CHAT_SEND_PREFIX = "/app/chat.send/";
    private static final String ACTIVE_ROOM_TOPIC = "/topic/pharmacists/rooms/active";

    private final CustomJwtDecoder customJwtDecoder;
    private final Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter;
    private final ChatService chatService;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        String destination = accessor.getDestination();
        String sessionId = accessor.getSessionId();
        if (StompCommand.CONNECT.equals(command)) {
            try {
                Authentication authentication = authenticateFromConnect(accessor);
                accessor.setUser(authentication);
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("STOMP CONNECT authenticated sessionId={} userId={}", sessionId, authentication.getName());
            } catch (Exception ex) {
                log.warn("STOMP CONNECT rejected sessionId={} reason={}", sessionId, ex.getMessage());
                throw ex;
            }
            return message;
        }

        Authentication authentication = resolveAuthentication(accessor.getUser());
        if (authentication == null) {
            log.warn("STOMP {} rejected sessionId={} destination={} reason=no-authentication", command, sessionId, destination);
            throw new IllegalArgumentException("Unauthorized websocket session");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);

        try {
            if (StompCommand.SUBSCRIBE.equals(command)) {
                authorizeSubscribe(authentication, destination);
            } else if (StompCommand.SEND.equals(command)) {
                authorizeSend(authentication, destination);
            }
        } catch (Exception ex) {
            log.warn(
                    "STOMP {} rejected sessionId={} userId={} destination={} reason={}",
                    command,
                    sessionId,
                    authentication.getName(),
                    destination,
                    ex.getMessage());
            throw ex;
        }

        return message;
    }

    @Override
    public void afterSendCompletion(
            @NonNull Message<?> message,
            @NonNull MessageChannel channel,
            boolean sent,
            Exception ex) {
        SecurityContextHolder.clearContext();
    }

    private Authentication authenticateFromConnect(StompHeaderAccessor accessor) {
        String headerValue = firstNativeHeader(accessor, "Authorization");
        if (headerValue == null || headerValue.isBlank()) {
            throw new IllegalArgumentException("Missing Authorization header");
        }

        String token = headerValue.trim();
        if (token.toLowerCase(Locale.ROOT).startsWith("bearer ")) {
            token = token.substring(7).trim();
        }
        if (token.isBlank()) {
            throw new IllegalArgumentException("Missing bearer token");
        }

        Jwt jwt = customJwtDecoder.decode(token);
        AbstractAuthenticationToken authentication = (AbstractAuthenticationToken) jwtAuthenticationConverter.convert(jwt);
        if (authentication == null) {
            throw new IllegalArgumentException("Unable to authenticate websocket session");
        }
        authentication.setDetails(accessor.getSessionId());
        return authentication;
    }

    private Authentication resolveAuthentication(Principal principal) {
        if (principal instanceof Authentication authentication) {
            return authentication;
        }
        return null;
    }

    private void authorizeSubscribe(Authentication authentication, String destination) {
        if (destination == null || destination.isBlank()) {
            return;
        }

        if (ACTIVE_ROOM_TOPIC.equals(destination)) {
            if (!hasRole(authentication, "PHARMACIST")) {
                throw new IllegalArgumentException("Forbidden active room subscription");
            }
            return;
        }

        if (destination.startsWith(TOPIC_CHAT_PREFIX)) {
            String roomId = destination.substring(TOPIC_CHAT_PREFIX.length());
            requireRoomAccess(authentication, roomId);
            return;
        }

        throw new IllegalArgumentException("Forbidden subscription destination");
    }

    private void authorizeSend(Authentication authentication, String destination) {
        if (destination == null || destination.isBlank()) {
            return;
        }

        if (!destination.startsWith(APP_CHAT_SEND_PREFIX)) {
            throw new IllegalArgumentException("Forbidden send destination");
        }

        String roomId = destination.substring(APP_CHAT_SEND_PREFIX.length());
        requireRoomAccess(authentication, roomId);
    }

    private void requireRoomAccess(Authentication authentication, String roomId) {
        UUID userId = UUID.fromString(authentication.getName());
        boolean isPharmacist = hasRole(authentication, "PHARMACIST");
        boolean canAccessRoom = chatService.canUserAccessRoom(
                roomId,
                userId,
                isPharmacist);

        if (!canAccessRoom) {
            log.warn("STOMP room access denied roomId={} userId={} isPharmacist={}", roomId, userId, isPharmacist);
            throw new IllegalArgumentException("Forbidden room access");
        }
    }

    private boolean hasRole(Authentication authentication, String roleName) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> ("ROLE_" + roleName).equals(authority.getAuthority()));
    }

    private String firstNativeHeader(StompHeaderAccessor accessor, String headerName) {
        return Optional.ofNullable(accessor.getNativeHeader(headerName))
                .filter(values -> !values.isEmpty())
                .map(values -> values.get(0))
                .orElse(null);
    }
}
