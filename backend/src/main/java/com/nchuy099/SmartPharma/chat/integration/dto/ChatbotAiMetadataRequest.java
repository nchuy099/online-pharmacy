package com.nchuy099.SmartPharma.chat.integration.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ChatbotAiMetadataRequest(
        @JsonProperty("conversation_id") String conversationId,
        @JsonProperty("user_message") String userMessage,
        @JsonProperty("assistant_reply") String assistantReply,
        @JsonProperty("user_context") Map<String, Object> userContext,
        @JsonProperty("conversation_context") Map<String, Object> conversationContext) {
}
