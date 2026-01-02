package com.nchuy099.SmartPharma.chat.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import com.nchuy099.SmartPharma.chat.integration.dto.ChatbotAiMetadataResponse;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;

class ChatbotAiClientTest {

    private RestTemplate restTemplate;
    private ChatbotInternalJwtService internalJwtService;
    private SecurityUtils securityUtils;
    private ChatbotAiClient client;

    @BeforeEach
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        internalJwtService = mock(ChatbotInternalJwtService.class);
        securityUtils = mock(SecurityUtils.class);
        client = new ChatbotAiClient(restTemplate, internalJwtService, securityUtils);
        ReflectionTestUtils.setField(client, "baseUrl", "http://chatbot-ai");
    }

    @Test
    void requestChatReplyShouldSendContextSnapshot() {
        UUID userId = UUID.randomUUID();
        UUID conversationId = UUID.randomUUID();
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(internalJwtService.createToken(userId, conversationId.toString())).thenReturn("token");
        when(restTemplate.postForEntity(
                any(String.class),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.eq(Map.class))).thenReturn(
                        ResponseEntity.ok(Map.of("reply", "Xin chào")));

        String reply = client.requestChatReply(
                userId,
                conversationId.toString(),
                "Xin chào",
                Map.of("profile", Map.of("fullName", "Nguyen Van A")),
                Map.of("summary", "đau đầu"));

        assertEquals("Xin chào", reply);
        verify(internalJwtService).createToken(userId, conversationId.toString());
        verify(restTemplate).postForEntity(any(String.class), any(HttpEntity.class), org.mockito.ArgumentMatchers.eq(Map.class));
    }

    @Test
    void requestMetadataShouldReturnTitleAndSummary() {
        UUID userId = UUID.randomUUID();
        UUID conversationId = UUID.randomUUID();
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(internalJwtService.createToken(userId, conversationId.toString())).thenReturn("token");
        when(restTemplate.postForEntity(
                any(String.class),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.eq(Map.class))).thenReturn(
                        ResponseEntity.ok(Map.of("title", "Tư vấn ho khan", "summary", "Người dùng hỏi về ho khan.")));

        ChatbotAiMetadataResponse response = client.requestChatMetadata(
                userId,
                conversationId.toString(),
                Map.of("profile", Map.of("fullName", "Nguyen Van A")),
                Map.of("summary", "đau đầu"),
                "Xin chào",
                "Chào bạn");

        assertEquals("Tư vấn ho khan", response.title());
        assertEquals("Người dùng hỏi về ho khan.", response.summary());
        verify(internalJwtService).createToken(userId, conversationId.toString());
        verify(restTemplate).postForEntity(any(String.class), any(HttpEntity.class), org.mockito.ArgumentMatchers.eq(Map.class));
    }
}
