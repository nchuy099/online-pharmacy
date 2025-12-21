package com.nchuy099.SmartPharma.chat.integration;

import java.util.UUID;
import java.util.Map;

public record ChatContextSnapshot(
        String conversationId,
        UUID userId,
        String userMessage,
        String assistantReply,
        Map<String, Object> userContext,
        Map<String, Object> conversationContext,
        int messageCount,
        boolean allowTitleUpdate) {

    public ChatContextSnapshot withAssistantReply(String reply) {
        return new ChatContextSnapshot(
                conversationId,
                userId,
                userMessage,
                reply,
                userContext,
                conversationContext,
                messageCount,
                allowTitleUpdate);
    }
}
