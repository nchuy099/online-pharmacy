package com.nchuy099.SmartPharma.chat.integration.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ChatbotAiChatRequest(
        @JsonProperty("conversation_id") String conversationId,
        @JsonProperty("message") String message,
        @JsonProperty("user_context") Map<String, Object> userContext,
        @JsonProperty("conversation_context") Map<String, Object> conversationContext) {
}
