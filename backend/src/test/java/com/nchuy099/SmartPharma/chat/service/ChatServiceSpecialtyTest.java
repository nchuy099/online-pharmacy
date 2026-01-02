package com.nchuy099.SmartPharma.chat.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

import com.nchuy099.SmartPharma.catalog.dto.CatalogOptionResponse;
import com.nchuy099.SmartPharma.catalog.entity.CatalogEntity;
import com.nchuy099.SmartPharma.catalog.entity.CatalogType;
import com.nchuy099.SmartPharma.catalog.repository.CatalogRepository;
import com.nchuy099.SmartPharma.chat.dto.request.CreateRoomRequest;
import com.nchuy099.SmartPharma.chat.dto.response.ChatRoomResponse;
import com.nchuy099.SmartPharma.chat.entity.ChatConversationEntity;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.chat.repository.ChatMessageRepository;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.PharmacistRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class ChatServiceSpecialtyTest {

    private CatalogRepository catalogRepository;
    private ChatConversationRepository chatConversationRepository;
    private ChatMessageRepository chatMessageRepository;
    private SecurityUtils securityUtils;
    private UserRepository userRepository;
    private PharmacistRepository pharmacistRepository;
    private ChatService chatService;

    @BeforeEach
    void setUp() {
        catalogRepository = mock(CatalogRepository.class);
        chatConversationRepository = mock(ChatConversationRepository.class);
        chatMessageRepository = mock(ChatMessageRepository.class);
        securityUtils = mock(SecurityUtils.class);
        userRepository = mock(UserRepository.class);
        pharmacistRepository = mock(PharmacistRepository.class);
        chatService = new ChatService(
                chatConversationRepository,
                chatMessageRepository,
                securityUtils,
                userRepository,
                pharmacistRepository,
                mock(ObjectProvider.class),
                catalogRepository);
    }

    @Test
    void getConsultationSpecialtiesShouldReturnActiveSpecialtiesFromCatalog() {
        CatalogEntity cardiology = CatalogEntity.builder()
                .type(CatalogType.SPECIALTY)
                .code("CARD")
                .name("Tim mạch")
                .isActive(true)
                .build();
        cardiology.setId(UUID.randomUUID());

        CatalogEntity digestive = CatalogEntity.builder()
                .type(CatalogType.SPECIALTY)
                .code("GI")
                .name("Tiêu hóa")
                .isActive(true)
                .build();
        digestive.setId(UUID.randomUUID());

        when(catalogRepository.findByTypeAndIsActiveTrueOrderByNameAsc(CatalogType.SPECIALTY))
                .thenReturn(List.of(cardiology, digestive));

        List<CatalogOptionResponse> result = chatService.getConsultationSpecialties();

        assertEquals(2, result.size());
        assertEquals(cardiology.getId().toString(), result.get(0).getId());
        assertEquals("CARD", result.get(0).getCode());
        assertEquals("Tim mạch", result.get(0).getName());
        assertEquals(CatalogType.SPECIALTY, result.get(0).getType());
        assertNull(result.get(0).getParentId());
    }

    @Test
    void createRoomShouldCreateNewAiRoomEvenIfAnActiveAiRoomExists() {
        UUID userId = UUID.randomUUID();
        UUID existingRoomId = UUID.randomUUID();
        UUID newRoomId = UUID.randomUUID();

        UserEntity user = new UserEntity();
        user.setId(userId);

        ChatConversationEntity existingRoom = ChatConversationEntity.builder()
                .type("AI")
                .status("ACTIVE")
                .build();
        existingRoom.setId(existingRoomId);
        existingRoom.setUser(user);
        existingRoom.setCreatedAt(Instant.now());
        existingRoom.setUpdatedAt(Instant.now());

        ChatConversationEntity savedRoom = ChatConversationEntity.builder()
                .type("AI")
                .status("WAITING")
                .build();
        savedRoom.setId(newRoomId);
        savedRoom.setUser(user);
        savedRoom.setCreatedAt(Instant.now());
        savedRoom.setUpdatedAt(Instant.now());

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(chatConversationRepository.findByUserIdOrderByUpdatedAtDesc(userId)).thenReturn(List.of(existingRoom));
        when(chatConversationRepository.save(any(ChatConversationEntity.class))).thenReturn(savedRoom);

        ChatRoomResponse result = chatService.createRoom(
                CreateRoomRequest.builder()
                        .type("AI")
                        .participantIds(List.of(userId.toString()))
                        .build());

        assertEquals(newRoomId.toString(), result.getId());
        verify(chatConversationRepository).save(any(ChatConversationEntity.class));
    }

    @Test
    void createRoomShouldReuseAnyActivePharmacistRoomRegardlessOfConsultationId() {
        UUID userId = UUID.randomUUID();
        UUID existingRoomId = UUID.randomUUID();

        UserEntity user = new UserEntity();
        user.setId(userId);

        ChatConversationEntity existingRoom = ChatConversationEntity.builder()
                .type("PHARMACIST")
                .status("WAITING")
                .consultationId("CARD")
                .build();
        existingRoom.setId(existingRoomId);
        existingRoom.setUser(user);
        existingRoom.setCreatedAt(Instant.now());
        existingRoom.setUpdatedAt(Instant.now());

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(chatConversationRepository.findByUserIdOrderByUpdatedAtDesc(userId)).thenReturn(List.of(existingRoom));

        ChatRoomResponse result = chatService.createRoom(
                CreateRoomRequest.builder()
                        .type("PHARMACIST")
                        .participantIds(List.of(userId.toString()))
                        .build());

        assertEquals(existingRoomId.toString(), result.getId());
    }
}
