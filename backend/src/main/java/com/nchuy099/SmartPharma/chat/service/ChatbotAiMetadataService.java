package com.nchuy099.SmartPharma.chat.service;

import java.util.UUID;
import java.util.Map;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.chat.entity.ChatConversationEntity;
import com.nchuy099.SmartPharma.chat.integration.ChatContextSnapshot;
import com.nchuy099.SmartPharma.chat.integration.ChatbotAiClient;
import com.nchuy099.SmartPharma.chat.integration.dto.ChatbotAiMetadataRequest;
import com.nchuy099.SmartPharma.chat.integration.dto.ChatbotAiMetadataResponse;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.chat.repository.ChatMessageRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatbotAiMetadataService {

    public static final long TITLE_REFINEMENT_MESSAGE_LIMIT = 8L;

    private final ChatConversationRepository chatConversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatbotAiClient chatbotAiClient;

    @Async("chatbotMetadataExecutor")
    public void refreshMetadata(ChatContextSnapshot snapshot) {
        if (snapshot == null) {
            return;
        }

        try {
            ChatbotAiMetadataResponse response = chatbotAiClient.requestChatMetadata(
                    snapshot.userId(),
                    new ChatbotAiMetadataRequest(
                            snapshot.conversationId(),
                            snapshot.userMessage(),
                            snapshot.assistantReply(),
                            snapshot.userContext(),
                            snapshot.conversationContext()));

            persistMetadata(snapshot, response);
        } catch (Exception ex) {
            log.warn(
                    "[chat][metadata] refresh failed conversationId={} error={}",
                    snapshot.conversationId(),
                    ex.getMessage());
        }
    }

    public void refreshMetadata(
            UUID userId,
            String conversationId,
            boolean allowTitleUpdate,
            Map<String, Object> userContext,
            Map<String, Object> conversationContext,
            String userMessage,
            String assistantReply) {
        refreshMetadata(new ChatContextSnapshot(
                conversationId,
                userId,
                userMessage,
                assistantReply,
                userContext,
                conversationContext,
                0,
                allowTitleUpdate));
    }

    public void refreshMetadata(
            String conversationId,
            boolean allowTitleUpdate,
            Map<String, Object> userContext,
            Map<String, Object> conversationContext,
            String userMessage,
            String assistantReply) {
        refreshMetadata(null, conversationId, allowTitleUpdate, userContext, conversationContext, userMessage, assistantReply);
    }

    void persistMetadata(ChatContextSnapshot snapshot, ChatbotAiMetadataResponse response) {
        if (response == null) {
            return;
        }

        UUID roomId = UUID.fromString(snapshot.conversationId());
        ChatConversationEntity room = chatConversationRepository.findById(roomId).orElse(null);
        if (room == null) {
            return;
        }

        long currentMessageCount = chatMessageRepository.countByChatRoomId(roomId);
        if (currentMessageCount != snapshot.messageCount()) {
            return;
        }

        String title = normalize(response.title());
        String summary = normalize(response.summary());

        if (summary != null) {
            room.setSummary(summary);
        }

        if (snapshot.allowTitleUpdate() && title != null) {
            room.setTitle(title);
            if (currentMessageCount >= TITLE_REFINEMENT_MESSAGE_LIMIT) {
                room.setTitleGenerated(true);
            }
        }

        chatConversationRepository.save(room);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
