package com.nchuy099.SmartPharma.chat.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.ObjectProvider;

import com.nchuy099.SmartPharma.catalog.repository.CatalogRepository;
import com.nchuy099.SmartPharma.chat.dto.request.SendMessageRequest;
import com.nchuy099.SmartPharma.chat.dto.response.ChatMessageResponse;
import com.nchuy099.SmartPharma.chat.entity.ChatConversationEntity;
import com.nchuy099.SmartPharma.chat.entity.ChatMessageEntity;
import com.nchuy099.SmartPharma.chat.integration.ChatContextSnapshot;
import com.nchuy099.SmartPharma.chat.integration.ChatbotAiClient;
import com.nchuy099.SmartPharma.chat.service.ChatbotAiMetadataService;
import com.nchuy099.SmartPharma.chat.integration.dto.ChatbotAiChatRequest;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.chat.repository.ChatMessageRepository;
import com.nchuy099.SmartPharma.chat.websocket.ChatWebSocketBroadcaster;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.PharmacistRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class ChatServiceAiChatTest {

    private ChatConversationRepository chatConversationRepository;
    private ChatMessageRepository chatMessageRepository;
    private ChatbotAiClient chatbotAiClient;
    private ChatbotAiMetadataService chatbotAiMetadataService;
    private SecurityUtils securityUtils;
    private ChatService chatService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        chatConversationRepository = mock(ChatConversationRepository.class);
        chatMessageRepository = mock(ChatMessageRepository.class);
        chatbotAiClient = mock(ChatbotAiClient.class);
        chatbotAiMetadataService = mock(ChatbotAiMetadataService.class);
        securityUtils = mock(SecurityUtils.class);

        ObjectProvider<ChatWebSocketBroadcaster> broadcasterProvider = mock(ObjectProvider.class);

        chatService = new ChatService(
                chatConversationRepository,
                chatMessageRepository,
                chatbotAiClient,
                chatbotAiMetadataService,
                securityUtils,
                mock(UserRepository.class),
                mock(PharmacistRepository.class),
                broadcasterProvider,
                mock(CatalogRepository.class));
    }

    @Test
    void handleAiChatShouldPersistCustomerAndAiMessages() {
        UUID roomId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        ChatConversationEntity room = ChatConversationEntity.builder()
                .type("AI")
                .status("ACTIVE")
                .build();
        room.setId(roomId);
        UserEntity customer = new UserEntity();
        customer.setId(userId);
        room.setUser(customer);

        when(chatConversationRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(securityUtils.hasRole("PHARMACIST")).thenReturn(false);
        when(chatbotAiClient.requestChatReply(any(UUID.class), any(ChatbotAiChatRequest.class)))
                .thenReturn("Tôi có thể giúp bạn.");
        when(chatMessageRepository.countByChatRoomId(roomId)).thenReturn(2L);
        when(chatMessageRepository.findByChatRoomIdOrderByCreatedAtDesc(eq(roomId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(java.util.List.of()));
        when(chatMessageRepository.save(any(ChatMessageEntity.class))).thenAnswer(invocation -> {
            ChatMessageEntity entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });

        ChatMessageResponse response = chatService.handleAiChat(roomId.toString(), "Xin chào");

        assertEquals("AI", response.getSenderType());
        assertEquals("Tôi có thể giúp bạn.", response.getContent());
        verify(chatbotAiClient).requestChatReply(any(UUID.class), any(ChatbotAiChatRequest.class));
        verify(chatbotAiMetadataService).refreshMetadata(any(ChatContextSnapshot.class));
        verify(chatMessageRepository, times(2)).save(any(ChatMessageEntity.class));

        ArgumentCaptor<ChatMessageEntity> messageCaptor = ArgumentCaptor.forClass(ChatMessageEntity.class);
        verify(chatMessageRepository, times(2)).save(messageCaptor.capture());
        var savedMessages = messageCaptor.getAllValues();
        assertEquals("CUSTOMER", savedMessages.get(0).getSenderType());
        assertEquals("Xin chào", savedMessages.get(0).getContent());
        assertEquals("AI", savedMessages.get(1).getSenderType());
        assertEquals("Tôi có thể giúp bạn.", savedMessages.get(1).getContent());
    }

    @Test
    void sendMessageShouldTriggerChatbotAiReplyForAiRooms() {
        UUID roomId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        ChatConversationEntity room = ChatConversationEntity.builder()
                .type("AI")
                .status("ACTIVE")
                .build();
        room.setId(roomId);
        UserEntity customer = new UserEntity();
        customer.setId(userId);
        room.setUser(customer);

        when(chatConversationRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(securityUtils.hasRole("PHARMACIST")).thenReturn(false);
        when(chatbotAiClient.requestChatReply(any(UUID.class), any(ChatbotAiChatRequest.class)))
                .thenReturn("Bạn có thể dùng thuốc ho.");
        when(chatMessageRepository.countByChatRoomId(roomId)).thenReturn(2L);
        when(chatMessageRepository.findByChatRoomIdOrderByCreatedAtDesc(eq(roomId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(java.util.List.of()));
        when(chatMessageRepository.save(any(ChatMessageEntity.class))).thenAnswer(invocation -> {
            ChatMessageEntity entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });

        ChatMessageResponse response = chatService.sendMessage(
                roomId.toString(),
                SendMessageRequest.builder()
                        .content("Mình bị ho")
                        .type("TEXT")
                        .senderType("CUSTOMER")
                        .build());

        assertEquals("CUSTOMER", response.getSenderType());
        verify(chatbotAiClient).requestChatReply(any(UUID.class), any(ChatbotAiChatRequest.class));
        verify(chatbotAiMetadataService).refreshMetadata(any(ChatContextSnapshot.class));
        verify(chatMessageRepository, times(2)).save(any(ChatMessageEntity.class));
    }
}
