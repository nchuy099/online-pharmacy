package com.nchuy099.SmartPharma.chat.controller;

import java.security.Principal;
import java.util.UUID;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.security.core.Authentication;

import com.nchuy099.SmartPharma.chat.dto.request.SendMessageRequest;
import com.nchuy099.SmartPharma.chat.service.ChatService;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatStompController {

    private final ChatService chatService;

    @MessageMapping("/chat.send/{roomId}")
    public void sendMessage(
            @DestinationVariable String roomId,
            SendMessageRequest request,
            Principal principal) {
        log.debug("STOMP send message roomId={} principalType={}", roomId, principal != null ? principal.getClass().getSimpleName() : "null");
        SendMessageRequest safeRequest = SendMessageRequest.builder()
                .content(request != null ? request.getContent() : null)
                .type(request != null ? request.getType() : null)
                .senderType(hasRole(principal, "PHARMACIST") ? "PHARMACIST" : "CUSTOMER")
                .build();
        UUID userId = resolveUserId(principal);
        boolean isPharmacist = hasRole(principal, "PHARMACIST");
        try {
            chatService.sendMessageAsUser(
                    roomId,
                    safeRequest,
                    userId,
                    isPharmacist);
        } catch (Exception ex) {
            log.warn(
                    "STOMP send failed roomId={} userId={} isPharmacist={} type={} reason={}",
                    roomId,
                    userId,
                    isPharmacist,
                    safeRequest.getType(),
                    ex.getMessage());
            throw ex;
        }
    }

    private boolean hasRole(Principal principal, String roleName) {
        if (!(principal instanceof Authentication authentication)) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> ("ROLE_" + roleName).equals(authority.getAuthority()));
    }

    private UUID resolveUserId(Principal principal) {
        if (!(principal instanceof Authentication authentication)) {
            log.warn("STOMP resolve user failed: principal is not Authentication principalType={}",
                    principal != null ? principal.getClass().getName() : "null");
            throw new AppException(ErrorCode.UNAUTHORIZED, "Unauthorized chat access");
        }
        try {
            return UUID.fromString(authentication.getName());
        } catch (Exception ex) {
            log.warn("STOMP resolve user failed: authentication name is not UUID name={}", authentication.getName());
            throw new AppException(ErrorCode.UNAUTHORIZED, "Unauthorized chat access");
        }
    }
}
