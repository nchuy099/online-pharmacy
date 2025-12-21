package com.nchuy099.SmartPharma.chat.integration;

import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.nchuy099.SmartPharma.chat.integration.dto.ChatbotAiChatRequest;
import com.nchuy099.SmartPharma.chat.integration.dto.ChatbotAiMetadataRequest;
import com.nchuy099.SmartPharma.chat.integration.dto.ChatbotAiMetadataResponse;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatbotAiClient {

    private final RestTemplate restTemplate;
    private final ChatbotInternalJwtService internalJwtService;
    private final SecurityUtils securityUtils;

    @Value("${chatbot-ai.base-url}")
    private String baseUrl;

    public String requestChatReply(
            UUID userId,
            String conversationId,
            String message,
            Map<String, Object> userContext,
            Map<String, Object> conversationContext) {
        return requestChatReply(userId, new ChatbotAiChatRequest(conversationId, message, userContext, conversationContext));
    }

    public String requestChatReply(
            String conversationId,
            String message,
            Map<String, Object> userContext,
            Map<String, Object> conversationContext) {
        return requestChatReply(null, conversationId, message, userContext, conversationContext);
    }

    public String requestChatReply(UUID userId, ChatbotAiChatRequest request) {
        UUID resolvedUserId = userId != null ? userId : securityUtils.getCurrentUserId();
        String token = internalJwtService.createToken(resolvedUserId, request.conversationId());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        HttpEntity<ChatbotAiChatRequest> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(baseUrl + "/api/v1/chat", entity, Map.class);
            Map body = response.getBody();
            if (body == null) {
                throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Empty chatbot-ai response");
            }

            Object reply = body.get("reply");
            if (!(reply instanceof String replyText) || replyText.isBlank()) {
                throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Missing chatbot-ai reply");
            }

            return replyText;
        } catch (RestClientException ex) {
            log.error("Failed to call chatbot-ai service: {}", ex.getMessage());
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to call chatbot-ai service");
        }
    }

    public String requestChatReply(ChatbotAiChatRequest request) {
        return requestChatReply(null, request);
    }

    public ChatbotAiMetadataResponse requestChatMetadata(
            UUID userId,
            String conversationId,
            Map<String, Object> userContext,
            Map<String, Object> conversationContext,
            String userMessage,
            String assistantReply) {
        return requestChatMetadata(
                userId,
                new ChatbotAiMetadataRequest(
                        conversationId,
                        userMessage,
                        assistantReply,
                        userContext,
                        conversationContext));
    }

    public ChatbotAiMetadataResponse requestChatMetadata(
            String conversationId,
            Map<String, Object> userContext,
            Map<String, Object> conversationContext,
            String userMessage,
            String assistantReply) {
        return requestChatMetadata(null, conversationId, userContext, conversationContext, userMessage, assistantReply);
    }

    public ChatbotAiMetadataResponse requestChatMetadata(UUID userId, ChatbotAiMetadataRequest request) {
        UUID resolvedUserId = userId != null ? userId : securityUtils.getCurrentUserId();
        String token = internalJwtService.createToken(resolvedUserId, request.conversationId());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        HttpEntity<ChatbotAiMetadataRequest> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(baseUrl + "/api/v1/chat/metadata", entity, Map.class);
            Map body = response.getBody();
            if (body == null) {
                throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Empty chatbot-ai response");
            }

            Object title = body.get("title");
            Object summary = body.get("summary");
            if (!(title instanceof String titleText) || titleText.isBlank()) {
                throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Missing chatbot-ai title");
            }
            if (!(summary instanceof String summaryText)) {
                throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Missing chatbot-ai summary");
            }
            return new ChatbotAiMetadataResponse(titleText, summaryText);
        } catch (RestClientException ex) {
            log.error("Failed to call chatbot-ai service: {}", ex.getMessage());
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to call chatbot-ai service");
        }
    }

    public ChatbotAiMetadataResponse requestChatMetadata(ChatbotAiMetadataRequest request) {
        return requestChatMetadata(null, request);
    }
}
