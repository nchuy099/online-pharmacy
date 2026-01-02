package com.nchuy099.SmartPharma.chat.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Page;

import com.nchuy099.SmartPharma.catalog.repository.CatalogRepository;
import com.nchuy099.SmartPharma.chat.entity.ChatConversationEntity;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.chat.repository.ChatMessageRepository;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.user.entity.PharmacistEntity;
import com.nchuy099.SmartPharma.user.repository.PharmacistRepository;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class ChatServiceActiveRoomsBySpecialtyTest {

    private ChatConversationRepository chatConversationRepository;
    private ChatMessageRepository chatMessageRepository;
    private SecurityUtils securityUtils;
    private PharmacistRepository pharmacistRepository;
    private ChatService chatService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        chatConversationRepository = mock(ChatConversationRepository.class);
        chatMessageRepository = mock(ChatMessageRepository.class);
        securityUtils = mock(SecurityUtils.class);
        pharmacistRepository = mock(PharmacistRepository.class);

        chatService = new ChatService(
                chatConversationRepository,
                chatMessageRepository,
                securityUtils,
                mock(UserRepository.class),
                pharmacistRepository,
                mock(ObjectProvider.class),
                mock(CatalogRepository.class));
    }

    @Test
    void getActiveRoomsShouldReturnAllWaitingAndActivePharmacistRooms() {
        UUID pharmacistUserId = UUID.randomUUID();

        UserEntity pharmacistUser = UserEntity.builder().build();
        pharmacistUser.setId(pharmacistUserId);

        PharmacistEntity pharmacist = PharmacistEntity.builder()
                .user(pharmacistUser)
                .build();

        ChatConversationEntity roomCard = room("PHARMACIST", "WAITING", "CARD");
        ChatConversationEntity roomGi = room("PHARMACIST", "WAITING", "GI");
        ChatConversationEntity roomGeneral = room("PHARMACIST", "WAITING", null);

        when(securityUtils.hasRole("PHARMACIST")).thenReturn(true);
        when(securityUtils.getCurrentUserId()).thenReturn(pharmacistUserId);
        when(pharmacistRepository.findByUserIdWithSpecialty(pharmacistUserId)).thenReturn(Optional.of(pharmacist));
        when(chatConversationRepository.findAll()).thenReturn(List.of(roomCard, roomGi, roomGeneral));
        when(chatMessageRepository.findByChatRoomIdOrderByCreatedAtDesc(any(UUID.class), any())).thenReturn(Page.empty());

        var result = chatService.getActiveRooms();

        assertEquals(3, result.size());
        List<String> roomIds = result.stream().map(r -> r.getId()).toList();
        assertTrue(roomIds.contains(roomCard.getId().toString()));
        assertTrue(roomIds.contains(roomGi.getId().toString()));
        assertTrue(roomIds.contains(roomGeneral.getId().toString()));
    }

    @Test
    void getActiveRoomsShouldReturnAllWaitingAndActiveRoomsEvenWithoutPharmacistRoleFlag() {
        UUID pharmacistUserId = UUID.randomUUID();

        UserEntity pharmacistUser = UserEntity.builder().build();
        pharmacistUser.setId(pharmacistUserId);

        PharmacistEntity pharmacist = PharmacistEntity.builder()
                .user(pharmacistUser)
                .build();

        ChatConversationEntity roomPediatric = room("PHARMACIST", "WAITING", "PEDIATRIC");
        ChatConversationEntity roomRespiratory = room("PHARMACIST", "WAITING", "RESPIRATORY");
        ChatConversationEntity roomGeneral = room("PHARMACIST", "WAITING", null);

        when(securityUtils.hasRole("PHARMACIST")).thenReturn(false);
        when(securityUtils.getCurrentUserId()).thenReturn(pharmacistUserId);
        when(pharmacistRepository.findByUserIdWithSpecialty(pharmacistUserId)).thenReturn(Optional.of(pharmacist));
        when(chatConversationRepository.findAll()).thenReturn(List.of(roomPediatric, roomRespiratory, roomGeneral));
        when(chatMessageRepository.findByChatRoomIdOrderByCreatedAtDesc(any(UUID.class), any())).thenReturn(Page.empty());

        var result = chatService.getActiveRooms();

        assertEquals(3, result.size());
        List<String> roomIds = result.stream().map(r -> r.getId()).toList();
        assertTrue(roomIds.contains(roomPediatric.getId().toString()));
        assertTrue(roomIds.contains(roomRespiratory.getId().toString()));
        assertTrue(roomIds.contains(roomGeneral.getId().toString()));
    }

    private ChatConversationEntity room(String type, String status, String consultationId) {
        ChatConversationEntity room = ChatConversationEntity.builder()
                .type(type)
                .status(status)
                .consultationId(consultationId)
                .build();
        room.setId(UUID.randomUUID());
        room.setCreatedAt(Instant.now());
        room.setUpdatedAt(Instant.now());
        return room;
    }
}
