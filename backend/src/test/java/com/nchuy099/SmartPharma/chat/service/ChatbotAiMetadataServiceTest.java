package com.nchuy099.SmartPharma.chat.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.chat.entity.ChatConversationEntity;
import com.nchuy099.SmartPharma.chat.integration.ChatContextSnapshot;
import com.nchuy099.SmartPharma.chat.integration.ChatbotAiClient;
import com.nchuy099.SmartPharma.chat.integration.dto.ChatbotAiMetadataRequest;
import com.nchuy099.SmartPharma.chat.integration.dto.ChatbotAiMetadataResponse;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.chat.repository.ChatMessageRepository;

class ChatbotAiMetadataServiceTest {

    private ChatConversationRepository chatConversationRepository;
    private ChatMessageRepository chatMessageRepository;
    private ChatbotAiClient chatbotAiClient;
    private ChatbotAiMetadataService service;

    @BeforeEach
    void setUp() {
        chatConversationRepository = mock(ChatConversationRepository.class);
        chatMessageRepository = mock(ChatMessageRepository.class);
        chatbotAiClient = mock(ChatbotAiClient.class);
        service = new ChatbotAiMetadataService(chatConversationRepository, chatMessageRepository, chatbotAiClient);
    }

    @Test
    void refreshMetadataShouldPersistGeneratedTitleAndSummary() {
        UUID roomId = UUID.randomUUID();
        ChatConversationEntity room = ChatConversationEntity.builder()
                .type("AI")
                .status("ACTIVE")
                .titleGenerated(false)
                .build();
        room.setId(roomId);
        when(chatConversationRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(chatMessageRepository.countByChatRoomId(roomId)).thenReturn(0L);
        when(chatbotAiClient.requestChatMetadata(any(UUID.class), any(ChatbotAiMetadataRequest.class)))
                .thenReturn(new ChatbotAiMetadataResponse("Tư vấn ho khan", "Người dùng hỏi về ho khan."));

        service.refreshMetadata(
                roomId,
                roomId.toString(),
                true,
                java.util.Map.of("profile", java.util.Map.of("fullName", "Nguyen Van A")),
                java.util.Map.of("summary", "đau đầu"),
                "Xin chào",
                "Chào bạn");

        verify(chatbotAiClient).requestChatMetadata(any(UUID.class), any(ChatbotAiMetadataRequest.class));
        verify(chatConversationRepository).save(room);
        assertEquals("Tư vấn ho khan", room.getTitle());
        assertEquals("Người dùng hỏi về ho khan.", room.getSummary());
        assertEquals(false, room.isTitleGenerated());
    }

    @Test
    void refreshMetadataShouldLockTitleAfterRefinementWindow() {
        UUID roomId = UUID.randomUUID();
        ChatConversationEntity room = ChatConversationEntity.builder()
                .type("AI")
                .status("ACTIVE")
                .titleGenerated(false)
                .build();
        room.setId(roomId);
        when(chatConversationRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(chatMessageRepository.countByChatRoomId(roomId)).thenReturn(ChatbotAiMetadataService.TITLE_REFINEMENT_MESSAGE_LIMIT);
        when(chatbotAiClient.requestChatMetadata(any(UUID.class), any(ChatbotAiMetadataRequest.class)))
                .thenReturn(new ChatbotAiMetadataResponse("Tư vấn ho khan", "Người dùng hỏi về ho khan."));

        service.persistMetadata(
                new ChatContextSnapshot(
                        roomId.toString(),
                        roomId,
                        "Xin chào",
                        "Chào bạn",
                        java.util.Map.of("profile", java.util.Map.of("fullName", "Nguyen Van A")),
                        java.util.Map.of("summary", "đau đầu"),
                        (int) ChatbotAiMetadataService.TITLE_REFINEMENT_MESSAGE_LIMIT,
                        true),
                new ChatbotAiMetadataResponse("Tư vấn ho khan", "Người dùng hỏi về ho khan."));

        verify(chatConversationRepository).save(room);
        assertEquals("Tư vấn ho khan", room.getTitle());
        assertEquals("Người dùng hỏi về ho khan.", room.getSummary());
        assertEquals(true, room.isTitleGenerated());
    }
}
