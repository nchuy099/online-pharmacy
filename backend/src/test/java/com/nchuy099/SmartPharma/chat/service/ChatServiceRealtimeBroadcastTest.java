package com.nchuy099.SmartPharma.chat.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;

import com.nchuy099.SmartPharma.catalog.repository.CatalogRepository;
import com.nchuy099.SmartPharma.chat.dto.request.SendMessageRequest;
import com.nchuy099.SmartPharma.chat.dto.response.ChatMessageResponse;
import com.nchuy099.SmartPharma.chat.dto.response.ChatRoomResponse;
import com.nchuy099.SmartPharma.chat.entity.ChatConversationEntity;
import com.nchuy099.SmartPharma.chat.entity.ChatMessageEntity;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.chat.repository.ChatMessageRepository;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.chat.websocket.ChatWebSocketBroadcaster;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.user.entity.PharmacistEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.PharmacistRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class ChatServiceRealtimeBroadcastTest {

    private ChatConversationRepository chatConversationRepository;
    private ChatMessageRepository chatMessageRepository;
    private SecurityUtils securityUtils;
    private PharmacistRepository pharmacistRepository;
    private UserRepository userRepository;
    private ChatWebSocketBroadcaster broadcaster;
    private ChatService chatService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        chatConversationRepository = mock(ChatConversationRepository.class);
        chatMessageRepository = mock(ChatMessageRepository.class);
        securityUtils = mock(SecurityUtils.class);
        pharmacistRepository = mock(PharmacistRepository.class);
        userRepository = mock(UserRepository.class);
        broadcaster = mock(ChatWebSocketBroadcaster.class);
        ObjectProvider<ChatWebSocketBroadcaster> broadcasterProvider = mock(ObjectProvider.class);
        when(broadcasterProvider.getIfAvailable()).thenReturn(broadcaster);

        chatService = new ChatService(
                chatConversationRepository,
                chatMessageRepository,
                securityUtils,
                userRepository,
                pharmacistRepository,
                broadcasterProvider,
                mock(CatalogRepository.class));
    }

    @Test
    void sendMessageShouldBroadcastToRoomTopic() {
        UUID roomId = UUID.randomUUID();
        UUID senderId = UUID.randomUUID();

        ChatConversationEntity room = ChatConversationEntity.builder()
                .type("PHARMACIST")
                .status("WAITING")
                .build();
        room.setId(roomId);
        room.setCreatedAt(Instant.now());
        room.setUpdatedAt(Instant.now());
        UserEntity customer = new UserEntity();
        customer.setId(senderId);
        room.setUser(customer);

        when(chatConversationRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(securityUtils.getCurrentUserId()).thenReturn(senderId);
        when(securityUtils.hasRole("PHARMACIST")).thenReturn(false);
        UUID messageId = UUID.randomUUID();
        when(chatMessageRepository.save(any(ChatMessageEntity.class))).thenAnswer(invocation -> {
            ChatMessageEntity entity = invocation.getArgument(0);
            entity.setId(messageId);
            return entity;
        });

        SendMessageRequest req = SendMessageRequest.builder()
                .content("xin chao")
                .type("TEXT")
                .senderType("CUSTOMER")
                .build();

        ChatMessageResponse response = chatService.sendMessage(roomId.toString(), req);

        assertEquals(messageId.toString(), response.getId());
        ArgumentCaptor<ChatMessageResponse> responseCaptor = ArgumentCaptor.forClass(ChatMessageResponse.class);
        verify(broadcaster).broadcast(eq("/topic/chat/" + roomId), responseCaptor.capture());
        assertEquals(messageId.toString(), responseCaptor.getValue().getId());
        assertEquals("CUSTOMER", responseCaptor.getValue().getSenderType());
    }

    @Test
    void joinRoomShouldBroadcastSystemAcceptanceMessageWhenWaitingRoomIsAccepted() {
        UUID roomId = UUID.randomUUID();
        UUID pharmacistUserId = UUID.randomUUID();
        UUID pharmacistId = UUID.randomUUID();

        UserEntity pharmacistUser = new UserEntity();
        pharmacistUser.setId(pharmacistUserId);
        pharmacistUser.setFullName("Nguyen Van A");

        PharmacistEntity pharmacist = PharmacistEntity.builder()
                .user(pharmacistUser)
                .build();
        pharmacist.setId(pharmacistId);

        ChatConversationEntity room = ChatConversationEntity.builder()
                .type("PHARMACIST")
                .status("WAITING")
                .build();
        room.setId(roomId);
        room.setCreatedAt(Instant.now());
        room.setUpdatedAt(Instant.now());

        when(securityUtils.getCurrentUserId()).thenReturn(pharmacistUserId);
        when(pharmacistRepository.findByUserId(pharmacistUserId)).thenReturn(Optional.of(pharmacist));
        when(chatConversationRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(chatConversationRepository.save(any(ChatConversationEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UUID messageId = UUID.randomUUID();
        when(chatMessageRepository.save(any(ChatMessageEntity.class))).thenAnswer(invocation -> {
            ChatMessageEntity entity = invocation.getArgument(0);
            entity.setId(messageId);
            return entity;
        });

        ChatRoomResponse result = chatService.joinRoom(roomId.toString());

        assertEquals("ACTIVE", result.getStatus());
        assertEquals("ACTIVE", room.getStatus());

        ArgumentCaptor<ChatMessageResponse> responseCaptor = ArgumentCaptor.forClass(ChatMessageResponse.class);
        verify(broadcaster).broadcast(eq("/topic/chat/" + roomId), responseCaptor.capture());
        assertEquals(messageId.toString(), responseCaptor.getValue().getId());
        assertEquals("SYSTEM", responseCaptor.getValue().getSenderType());
        assertEquals("Dược sĩ Nguyen Van A đã nhận tư vấn", responseCaptor.getValue().getContent());
        assertEquals("Dược sĩ Nguyen Van A đã nhận tư vấn", room.getLastMessage());
    }

    @Test
    void joinRoomShouldRejectRoomAlreadyAssignedToAnotherPharmacist() {
        UUID roomId = UUID.randomUUID();
        UUID currentPharmacistUserId = UUID.randomUUID();
        UUID currentPharmacistId = UUID.randomUUID();
        UUID otherPharmacistId = UUID.randomUUID();

        UserEntity currentPharmacistUser = new UserEntity();
        currentPharmacistUser.setId(currentPharmacistUserId);

        PharmacistEntity currentPharmacist = PharmacistEntity.builder()
                .user(currentPharmacistUser)
                .build();
        currentPharmacist.setId(currentPharmacistId);

        UserEntity otherPharmacistUser = new UserEntity();
        otherPharmacistUser.setId(UUID.randomUUID());

        PharmacistEntity otherPharmacist = PharmacistEntity.builder()
                .user(otherPharmacistUser)
                .build();
        otherPharmacist.setId(otherPharmacistId);

        ChatConversationEntity room = ChatConversationEntity.builder()
                .type("PHARMACIST")
                .status("ACTIVE")
                .pharmacist(otherPharmacist)
                .build();
        room.setId(roomId);
        room.setCreatedAt(Instant.now());
        room.setUpdatedAt(Instant.now());

        when(securityUtils.getCurrentUserId()).thenReturn(currentPharmacistUserId);
        when(pharmacistRepository.findByUserId(currentPharmacistUserId)).thenReturn(Optional.of(currentPharmacist));
        when(chatConversationRepository.findById(roomId)).thenReturn(Optional.of(room));

        AppException ex = assertThrows(AppException.class, () -> chatService.joinRoom(roomId.toString()));

        assertEquals("Room already assigned to another pharmacist", ex.getMessage());
    }

    @Test
    void closeRoomShouldBroadcastSystemClosedMessage() {
        UUID roomId = UUID.randomUUID();

        ChatConversationEntity room = ChatConversationEntity.builder()
                .type("PHARMACIST")
                .status("ACTIVE")
                .build();
        room.setId(roomId);
        room.setCreatedAt(Instant.now());
        room.setUpdatedAt(Instant.now());

        when(chatConversationRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(chatConversationRepository.save(any(ChatConversationEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(chatMessageRepository.save(any(ChatMessageEntity.class))).thenAnswer(invocation -> {
            ChatMessageEntity entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });

        chatService.closeRoom(roomId.toString());

        assertEquals("CLOSED", room.getStatus());
        assertEquals("Phiên tư vấn đã kết thúc", room.getLastMessage());

        ArgumentCaptor<ChatMessageResponse> responseCaptor = ArgumentCaptor.forClass(ChatMessageResponse.class);
        verify(broadcaster).broadcast(eq("/topic/chat/" + roomId), responseCaptor.capture());
        assertEquals("SYSTEM", responseCaptor.getValue().getSenderType());
        assertEquals("Phiên tư vấn đã kết thúc", responseCaptor.getValue().getContent());
    }
}
