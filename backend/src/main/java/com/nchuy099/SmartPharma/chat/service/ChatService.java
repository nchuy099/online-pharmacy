package com.nchuy099.SmartPharma.chat.service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.chat.dto.request.CreateRoomRequest;
import com.nchuy099.SmartPharma.chat.dto.request.SendMessageRequest;
import com.nchuy099.SmartPharma.chat.dto.response.ChatMessageResponse;
import com.nchuy099.SmartPharma.chat.dto.response.ActiveRoomEventResponse;
import com.nchuy099.SmartPharma.chat.dto.response.ChatRoomResponse;
import com.nchuy099.SmartPharma.chat.integration.ChatContextSnapshot;
import com.nchuy099.SmartPharma.chat.integration.ChatbotAiClient;
import com.nchuy099.SmartPharma.chat.entity.ChatConversationEntity;
import com.nchuy099.SmartPharma.chat.entity.ChatMessageEntity;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.chat.repository.ChatMessageRepository;
import com.nchuy099.SmartPharma.chat.websocket.ChatWebSocketBroadcaster;
import com.nchuy099.SmartPharma.catalog.dto.CatalogOptionResponse;
import com.nchuy099.SmartPharma.catalog.entity.CatalogEntity;
import com.nchuy099.SmartPharma.catalog.entity.CatalogType;
import com.nchuy099.SmartPharma.catalog.repository.CatalogRepository;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.user.entity.PharmacistEntity;
import com.nchuy099.SmartPharma.user.repository.PharmacistRepository;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ChatService {

    private final ChatConversationRepository chatConversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatbotAiClient chatbotAiClient;
    private final ChatbotAiMetadataService chatbotAiMetadataService;
    private final SecurityUtils securityUtils;
    private final UserRepository userRepository;
    private final PharmacistRepository pharmacistRepository;
    private final ObjectProvider<ChatWebSocketBroadcaster> chatWebSocketBroadcasterProvider;
    private final CatalogRepository catalogRepository;

    @Autowired
    public ChatService(
            ChatConversationRepository chatConversationRepository,
            ChatMessageRepository chatMessageRepository,
            ChatbotAiClient chatbotAiClient,
            ChatbotAiMetadataService chatbotAiMetadataService,
            SecurityUtils securityUtils,
            UserRepository userRepository,
            PharmacistRepository pharmacistRepository,
            ObjectProvider<ChatWebSocketBroadcaster> chatWebSocketBroadcasterProvider,
            CatalogRepository catalogRepository) {
        this.chatConversationRepository = chatConversationRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.chatbotAiClient = chatbotAiClient;
        this.chatbotAiMetadataService = chatbotAiMetadataService;
        this.securityUtils = securityUtils;
        this.userRepository = userRepository;
        this.pharmacistRepository = pharmacistRepository;
        this.chatWebSocketBroadcasterProvider = chatWebSocketBroadcasterProvider;
        this.catalogRepository = catalogRepository;
    }

    public ChatService(
            ChatConversationRepository chatConversationRepository,
            ChatMessageRepository chatMessageRepository,
            SecurityUtils securityUtils,
            UserRepository userRepository,
            PharmacistRepository pharmacistRepository,
            ObjectProvider<ChatWebSocketBroadcaster> chatWebSocketBroadcasterProvider,
            CatalogRepository catalogRepository) {
        this(
                chatConversationRepository,
                chatMessageRepository,
                null,
                null,
                securityUtils,
                userRepository,
                pharmacistRepository,
                chatWebSocketBroadcasterProvider,
                catalogRepository);
    }

    public ChatService(
            ChatConversationRepository chatConversationRepository,
            ChatMessageRepository chatMessageRepository,
            ChatbotAiClient chatbotAiClient,
            SecurityUtils securityUtils,
            UserRepository userRepository,
            PharmacistRepository pharmacistRepository,
            ObjectProvider<ChatWebSocketBroadcaster> chatWebSocketBroadcasterProvider,
            CatalogRepository catalogRepository) {
        this(
                chatConversationRepository,
                chatMessageRepository,
                chatbotAiClient,
                null,
                securityUtils,
                userRepository,
                pharmacistRepository,
                chatWebSocketBroadcasterProvider,
                catalogRepository);
    }

    // ── Room Management ──

    public ChatRoomResponse createRoom(CreateRoomRequest req) {
        log.info("Creating chat room: type={}", req.getType());

        UserEntity user = null;
        UUID requesterId = null;
        try {
            requesterId = securityUtils.getCurrentUserId();
            user = userRepository.findById(requesterId).orElse(null);
        } catch (Exception e) {
            log.info("Creating guest chat session");
        }

        // Check for existing active/waiting room for this user and type
        if (user != null && !"AI".equalsIgnoreCase(req.getType())) {
            List<ChatConversationEntity> existingRooms = chatConversationRepository
                    .findByUserIdOrderByUpdatedAtDesc(requesterId);

            ChatConversationEntity activeRoom = existingRooms.stream()
                    .filter(r -> r.getType().equalsIgnoreCase(req.getType()) &&
                            List.of("WAITING", "ACTIVE").contains(r.getStatus()))
                    .findFirst()
                    .orElse(null);

            if (activeRoom != null) {
                log.info("Found existing active session for user {}: {}", requesterId, activeRoom.getId());
                return mapToRoomResponse(activeRoom, null);
            }
        }

        ChatConversationEntity conversation = ChatConversationEntity.builder()
                .user(user)
                .type(req.getType())
                .status("WAITING")
                .consultationId(normalizeConsultationId(req.getConsultationId()))
                .build();

        conversation = chatConversationRepository.save(conversation);
        return mapToRoomResponse(conversation, null);
    }

    public List<ChatRoomResponse> getMyRooms() {
        UUID userId = securityUtils.getCurrentUserId();
        log.info("Getting chat rooms for user: {}", userId);

        List<ChatConversationEntity> conversations = chatConversationRepository
                .findByUserIdOrderByUpdatedAtDesc(userId);

        if (securityUtils.hasRole("PHARMACIST")) {
            PharmacistEntity pharmacist = pharmacistRepository.findByUserId(userId).orElse(null);
            if (pharmacist != null) {
                List<ChatConversationEntity> pharmacistRooms = chatConversationRepository
                        .findByPharmacistIdOrderByUpdatedAtDesc(pharmacist.getId());
                // Merge and sort
                conversations.addAll(pharmacistRooms);
                conversations.sort((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()));
            }
        }

        return conversations.stream()
                .map(conversation -> {
                    Page<ChatMessageEntity> lastMessages = chatMessageRepository
                            .findByChatRoomIdOrderByCreatedAtDesc(conversation.getId(),
                                    PageRequest.of(0, 1));
                    ChatMessageEntity lastMsg = lastMessages.hasContent() ? lastMessages.getContent().get(0) : null;
                    return mapToRoomResponse(conversation, lastMsg);
                })
                .collect(Collectors.toList());
    }

    public List<CatalogOptionResponse> getConsultationSpecialties() {
        return catalogRepository.findByTypeAndIsActiveTrueOrderByNameAsc(CatalogType.SPECIALTY).stream()
                .map(this::mapToCatalogOptionResponse)
                .collect(Collectors.toList());
    }

    // ── Messages ──

    public Page<ChatMessageResponse> getMessages(String roomId, int page, int size) {
        log.info("Getting messages for room: {}, page: {}", roomId, page);
        AccessContext accessContext = requireRoomAccessForCurrentUser(roomId);
        if (!canUserAccessRoom(roomId, accessContext.userId(), accessContext.isPharmacist())) {
            throw new AccessDeniedException("Forbidden room access");
        }

        Pageable pageable = PageRequest.of(page, size);
        return chatMessageRepository.findByChatRoomIdOrderByCreatedAtDesc(parseRoomId(roomId), pageable)
                .map(this::mapToMessageResponse);
    }

    public ChatMessageResponse sendMessage(String roomId, SendMessageRequest req) {
        AccessContext accessContext = requireRoomAccessForCurrentUser(roomId);
        return sendMessageInternal(roomId, req, accessContext);
    }

    public ChatMessageResponse sendMessageAsUser(
            String roomId,
            SendMessageRequest req,
            UUID userId,
            boolean isPharmacist) {
        AccessContext accessContext = new AccessContext(userId, isPharmacist);
        return sendMessageInternal(roomId, req, accessContext);
    }

    private ChatMessageResponse sendMessageInternal(
            String roomId,
            SendMessageRequest req,
            AccessContext accessContext) {
        if (!canUserAccessRoom(roomId, accessContext.userId(), accessContext.isPharmacist())) {
            throw new AccessDeniedException("Forbidden room access");
        }

        ChatConversationEntity room = chatConversationRepository.findById(parseRoomId(roomId))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Room not found"));

        if ("CLOSED".equals(room.getStatus())) {
            throw new AppException(ErrorCode.CONFLICT, "Chat session has ended");
        }

        final String finalSenderType = resolveSenderType(req, room, accessContext);
        final String senderId = "AI".equals(finalSenderType) ? "AI_BOT" : accessContext.userId().toString();

        ChatMessageEntity message = saveChatMessage(
                room.getId(),
                senderId,
                finalSenderType,
                req.getContent(),
                req.getType());

        // Update conversation timestamp and last message
        final String finalSenderId = senderId;
        boolean isNewActiveRoomEvent = "PHARMACIST".equals(room.getType())
                && "CUSTOMER".equals(finalSenderType)
                && (room.getLastMessage() == null || room.getLastMessage().isBlank());

        room.setUpdatedAt(java.time.Instant.now());
        room.setLastMessage(req.getContent());

        if ("PHARMACIST".equals(finalSenderType)) {
            // If a pharmacist is not already assigned, assign them
            if (room.getPharmacist() == null) {
                pharmacistRepository.findByUserId(UUID.fromString(finalSenderId)).ifPresent(p -> {
                    room.setPharmacist(p);
                    room.setStatus("ACTIVE");
                });
            }
        }

        chatConversationRepository.save(room);

        if (isNewActiveRoomEvent) {
            publishActiveRoomEvent(room);
        }

        // If it is an AI room and sender is a customer, trigger AI response
        if ("AI".equals(room.getType()) && "CUSTOMER".equals(finalSenderType)) {
            log.info("Triggering AI response for room: {}", roomId);
            sendAiReply(roomId, room, accessContext.userId(), req.getContent());
        }

        ChatMessageResponse response = mapToMessageResponse(message);
        broadcastRoomMessage(roomId, response);
        return response;
    }

    public boolean canUserAccessRoom(
            String roomId,
            UUID userId,
            boolean isPharmacist) {
        ChatConversationEntity room = chatConversationRepository.findById(parseRoomId(roomId)).orElse(null);
        if (room == null) {
            log.warn("Chat room access denied: room not found roomId={} userId={} isPharmacist={}", roomId, userId, isPharmacist);
            return false;
        }

        if (room.getUser() != null && userId.equals(room.getUser().getId())) {
            return true;
        }

        if (!isPharmacist) {
            log.warn(
                    "Chat room access denied: requester is not owner and not pharmacist roomId={} userId={} roomOwnerId={}",
                    roomId,
                    userId,
                    room.getUser() != null ? room.getUser().getId() : null);
            return false;
        }

        PharmacistEntity pharmacist = pharmacistRepository.findByUserIdWithSpecialty(userId).orElse(null);
        boolean allowed = canPharmacistAccessRoom(room, pharmacist);
        if (!allowed) {
            log.warn(
                    "Chat room access denied for pharmacist roomId={} userId={} pharmacistId={} roomPharmacistId={} roomConsultationId={} pharmacistSpecialtyCode={} roomStatus={}",
                    roomId,
                    userId,
                    pharmacist != null ? pharmacist.getId() : null,
                    room.getPharmacist() != null ? room.getPharmacist().getId() : null,
                    normalizeConsultationId(room.getConsultationId()),
                    pharmacist != null && pharmacist.getSpecialty() != null ? normalizeConsultationId(pharmacist.getSpecialty().getCode()) : null,
                    room.getStatus());
        }
        return allowed;
    }

    private void publishActiveRoomEvent(ChatConversationEntity room) {
        String customerId = "anonymous";
        String customerName = "Khách vãng lai";
        if (room.getUser() != null && room.getUser().getId() != null) {
            UUID customerUuid = room.getUser().getId();
            customerId = customerUuid.toString();
            customerName = userRepository.findById(customerUuid)
                    .map(UserEntity::getFullName)
                    .orElse(customerName);
        }

        ActiveRoomEventResponse event = ActiveRoomEventResponse.builder()
                .eventType("NEW_ACTIVE_ROOM")
                .roomId(room.getId().toString())
                .status(room.getStatus())
                .customerId(customerId)
                .customerName(customerName)
                .updatedAt(room.getUpdatedAt())
                .build();

        ChatWebSocketBroadcaster broadcaster = chatWebSocketBroadcasterProvider.getIfAvailable();
        if (broadcaster != null) {
            broadcaster.broadcast("/topic/pharmacists/rooms/active", event);
        }
    }

    private void broadcastRoomMessage(String roomId, ChatMessageResponse response) {
        ChatWebSocketBroadcaster broadcaster = chatWebSocketBroadcasterProvider.getIfAvailable();
        if (broadcaster != null) {
            broadcaster.broadcast("/topic/chat/" + roomId, response);
        }
    }

    private ChatMessageResponse createConsultationAcceptedMessage(ChatConversationEntity room, PharmacistEntity pharmacist) {
        String pharmacistName = pharmacist != null && pharmacist.getUser() != null
                ? pharmacist.getUser().getFullName()
                : "Dược sĩ";
        String content = "Dược sĩ " + pharmacistName + " đã nhận tư vấn";

        ChatMessageEntity message = saveChatMessage(
                room.getId(),
                "SYSTEM",
                "SYSTEM",
                content,
                "TEXT");

        room.setLastMessage(content);
        room.setUpdatedAt(java.time.Instant.now());
        chatConversationRepository.save(room);

        return mapToMessageResponse(message);
    }

    private ChatMessageResponse createConsultationClosedMessage(ChatConversationEntity room) {
        String content = "Phiên tư vấn đã kết thúc";

        ChatMessageEntity message = saveChatMessage(
                room.getId(),
                "SYSTEM",
                "SYSTEM",
                content,
                "TEXT");

        room.setLastMessage(content);
        room.setUpdatedAt(java.time.Instant.now());
        chatConversationRepository.save(room);

        return mapToMessageResponse(message);
    }

    private ChatMessageEntity saveChatMessage(
            UUID roomId,
            String senderId,
            String senderType,
            String content,
            String type) {
        ChatMessageEntity message = ChatMessageEntity.builder()
                .chatRoomId(roomId)
                .senderId(senderId)
                .senderType(senderType)
                .content(content)
                .type(type != null ? type : "TEXT")
                .status("SENT")
                .build();
        return chatMessageRepository.save(message);
    }

    private Map<String, Object> buildUserContext(UserEntity user) {
        if (user == null) {
            return new java.util.LinkedHashMap<>();
        }

        Map<String, Object> profile = new java.util.LinkedHashMap<>();
        profile.put("fullName", user.getFullName());
        profile.put("email", user.getEmail());
        profile.put("phoneNumber", user.getPhoneNumber());
        profile.put("dateOfBirth", user.getDateOfBirth() != null ? user.getDateOfBirth().toString() : null);
        profile.put("gender", user.getGender());

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("profile", profile);
        result.put("resolvedUserId", user.getId() != null ? user.getId().toString() : null);
        return result;
    }

    private Map<String, Object> buildConversationContext(ChatConversationEntity room, String userMessage, String assistantReply) {
        Page<ChatMessageEntity> recentMessages = chatMessageRepository.findByChatRoomIdOrderByCreatedAtDesc(
                room.getId(),
                PageRequest.of(0, 8));

        List<Map<String, Object>> recentTurns = recentMessages.getContent().stream()
                .sorted((left, right) -> left.getCreatedAt().compareTo(right.getCreatedAt()))
                .map(message -> {
                    Map<String, Object> turn = new java.util.LinkedHashMap<>();
                    turn.put("role", message.getSenderType() == null ? "unknown" : message.getSenderType().toLowerCase(Locale.ROOT));
                    turn.put("content", message.getContent());
                    turn.put("createdAt", message.getCreatedAt() != null ? message.getCreatedAt().toString() : null);
                    return turn;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("roomId", room.getId().toString());
        result.put("roomType", room.getType());
        result.put("title", room.getTitle());
        result.put("summary_text", room.getSummary());
        result.put("recent_turns", recentTurns);
        result.put("message_count", chatMessageRepository.countByChatRoomId(room.getId()));
        return result;
    }

    private ChatMessageResponse sendAiReply(String roomId, ChatConversationEntity room, UUID userId, String userMessage) {
        if (chatbotAiClient == null) {
            throw new IllegalStateException("Chatbot AI client is not configured");
        }

        UserEntity user = null;
        if (room.getUser() != null && room.getUser().getId() != null) {
            user = userRepository.findById(room.getUser().getId()).orElse(room.getUser());
        }
        Map<String, Object> userContext = buildUserContext(user);
        Map<String, Object> conversationContext = buildConversationContext(room, userMessage, null);
        String reply = chatbotAiClient.requestChatReply(
                userId,
                new com.nchuy099.SmartPharma.chat.integration.dto.ChatbotAiChatRequest(
                        roomId,
                        userMessage,
                        userContext,
                        conversationContext));
        ChatMessageEntity aiMessage = saveChatMessage(room.getId(), "AI_BOT", "AI", reply, "TEXT");

        room.setUpdatedAt(java.time.Instant.now());
        room.setLastMessage(reply);
        chatConversationRepository.save(room);

        ChatMessageResponse response = mapToMessageResponse(aiMessage);
        broadcastRoomMessage(roomId, response);

        if (chatbotAiMetadataService != null) {
            long messageCount = chatMessageRepository.countByChatRoomId(room.getId());
            ChatContextSnapshot snapshot = new ChatContextSnapshot(
                    roomId,
                    userId,
                    userMessage,
                    reply,
                    userContext,
                    buildConversationContext(room, userMessage, reply),
                    (int) messageCount,
                    messageCount <= ChatbotAiMetadataService.TITLE_REFINEMENT_MESSAGE_LIMIT);
            chatbotAiMetadataService.refreshMetadata(snapshot);
        }
        return response;
    }

    private CatalogOptionResponse mapToCatalogOptionResponse(CatalogEntity entity) {
        return CatalogOptionResponse.builder()
                .id(entity.getId() != null ? entity.getId().toString() : null)
                .type(entity.getType())
                .code(entity.getCode())
                .name(entity.getName())
                .parentId(entity.getParent() != null && entity.getParent().getId() != null
                        ? entity.getParent().getId().toString()
                        : null)
                .parentCode(entity.getParent() != null ? entity.getParent().getCode() : null)
                .parentName(entity.getParent() != null ? entity.getParent().getName() : null)
                .build();
    }

    public ChatMessageResponse sendMessageAsPharmacist(String roomId, String pharmacistId, SendMessageRequest req) {
        log.info("Pharmacist {} sending message in room: {}", pharmacistId, roomId);

        ChatConversationEntity room = chatConversationRepository.findById(parseRoomId(roomId))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Room not found"));

        if ("CLOSED".equals(room.getStatus())) {
            throw new AppException(ErrorCode.CONFLICT, "Chat session has ended");
        }

        ChatMessageEntity message = ChatMessageEntity.builder()
                .chatRoomId(room.getId())
                .senderId(pharmacistId)
                .senderType("PHARMACIST")
                .content(req.getContent())
                .type(req.getType() != null ? req.getType() : "TEXT")
                .status("SENT")
                .build();

        message = chatMessageRepository.save(message);

        room.setUpdatedAt(java.time.Instant.now());
        room.setLastMessage(req.getContent());
        chatConversationRepository.save(room);

        return mapToMessageResponse(message);
    }

    public ChatMessageResponse handleAiChat(String roomId, String message) {
        AccessContext accessContext = requireRoomAccessForCurrentUser(roomId);
        if (!canUserAccessRoom(roomId, accessContext.userId(), accessContext.isPharmacist())) {
            throw new AccessDeniedException("Forbidden room access");
        }

        ChatConversationEntity room = chatConversationRepository.findById(parseRoomId(roomId))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Room not found"));

        if ("CLOSED".equals(room.getStatus())) {
            throw new AppException(ErrorCode.CONFLICT, "Chat session has ended");
        }

        ChatMessageEntity userMessage = saveChatMessage(
                room.getId(),
                accessContext.userId().toString(),
                "CUSTOMER",
                message,
                "TEXT");

        room.setUpdatedAt(java.time.Instant.now());
        room.setLastMessage(message);
        chatConversationRepository.save(room);
        broadcastRoomMessage(roomId, mapToMessageResponse(userMessage));

        return sendAiReply(roomId, room, accessContext.userId(), message);
    }

    public void markAsRead(String roomId) {
        AccessContext accessContext = requireRoomAccessForCurrentUser(roomId);
        if (!canUserAccessRoom(roomId, accessContext.userId(), accessContext.isPharmacist())) {
            throw new AccessDeniedException("Forbidden room access");
        }
        String senderId = accessContext.userId().toString();
        UUID parsedRoomId = parseRoomId(roomId);

        List<ChatMessageEntity> unread = chatMessageRepository
                .findByChatRoomIdAndStatusAndSenderIdNot(parsedRoomId, "SENT", senderId);

        unread.forEach(msg -> {
            msg.setStatus("READ");
        });
        chatMessageRepository.saveAll(unread);
    }

    public List<ChatRoomResponse> getActiveRooms() {
        log.info("Getting all active/waiting pharmacist chat rooms");
        List<ChatConversationEntity> allRooms = chatConversationRepository.findAll();
        UUID currentUserId = securityUtils.getCurrentUserId();
        PharmacistEntity currentPharmacist = pharmacistRepository.findByUserIdWithSpecialty(currentUserId).orElse(null);
        if (currentPharmacist == null) {
            return List.of();
        }

        return allRooms.stream()
                .filter(r -> "PHARMACIST".equals(r.getType()) &&
                        List.of("WAITING", "ACTIVE").contains(r.getStatus()))
                .filter(r -> canPharmacistAccessRoom(r, currentPharmacist))
                .map(room -> {
                    Page<ChatMessageEntity> lastMessages = chatMessageRepository
                            .findByChatRoomIdOrderByCreatedAtDesc(room.getId(), PageRequest.of(0, 1));
                    ChatMessageEntity lastMsg = lastMessages.hasContent() ? lastMessages.getContent().get(0) : null;
                    return mapToRoomResponse(room, lastMsg);
                })
                .collect(Collectors.toList());
    }

    public ChatRoomResponse joinRoom(String roomId) {
        UUID userId = securityUtils.getCurrentUserId();
        PharmacistEntity pharmacist = pharmacistRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Pharmacist profile not found"));

        log.info("Pharmacist {} joining room: {}", userId, roomId);

        ChatConversationEntity room = chatConversationRepository.findById(parseRoomId(roomId))
                .orElseThrow(() -> new RuntimeException("Room not found"));

        boolean isAssignedToAnotherPharmacist = room.getPharmacist() != null
                && room.getPharmacist().getId() != null
                && !room.getPharmacist().getId().equals(pharmacist.getId());
        if (isAssignedToAnotherPharmacist) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Room already assigned to another pharmacist");
        }

        if (room.getPharmacist() == null || !room.getPharmacist().getId().equals(pharmacist.getId())) {
            boolean wasWaiting = "WAITING".equals(room.getStatus());
            room.setPharmacist(pharmacist);
            // Change status to ACTIVE when pharmacist joins
            if (wasWaiting) {
                room.setStatus("ACTIVE");
            }
            room.setUpdatedAt(java.time.Instant.now());
            chatConversationRepository.save(room);

            if (wasWaiting) {
                ChatMessageResponse systemMessage = createConsultationAcceptedMessage(room, pharmacist);
                broadcastRoomMessage(roomId, systemMessage);
            }
        }

        return mapToRoomResponse(room, null);
    }

    public void closeRoom(String roomId) {
        log.info("Closing chat room: {}", roomId);
        chatConversationRepository.findById(parseRoomId(roomId)).ifPresent(room -> {
            ChatMessageResponse systemMessage = createConsultationClosedMessage(room);
            room.setStatus("CLOSED");
            room.setUpdatedAt(java.time.Instant.now());
            chatConversationRepository.save(room);
            broadcastRoomMessage(roomId, systemMessage);
        });
    }

    // ── Mappers ──

    private ChatRoomResponse mapToRoomResponse(ChatConversationEntity room, ChatMessageEntity lastMessage) {
        String customerId = room.getUser() != null ? room.getUser().getId().toString() : "anonymous";
        String customerName = room.getUser() != null ? room.getUser().getFullName() : "Khách vãng lai";
        String pharmacistName = room.getPharmacist() != null && room.getPharmacist().getUser() != null
                ? room.getPharmacist().getUser().getFullName()
                : null;

        List<String> participantIds = new java.util.ArrayList<>();
        if (room.getUser() != null && room.getUser().getId() != null) {
            participantIds.add(room.getUser().getId().toString());
        }
        if (room.getPharmacist() != null
                && room.getPharmacist().getUser() != null
                && room.getPharmacist().getUser().getId() != null) {
            participantIds.add(room.getPharmacist().getUser().getId().toString());
        }

        Instant createdAt = room.getCreatedAt() != null ? room.getCreatedAt() : Instant.now();
        Instant updatedAt = room.getUpdatedAt() != null ? room.getUpdatedAt() : createdAt;

        return ChatRoomResponse.builder()
                .id(room.getId().toString())
                .consultationId(room.getConsultationId())
                .status(room.getStatus())
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .participantIds(participantIds)
                .type(room.getType())
                .lastMessage(lastMessage != null ? mapToMessageResponse(lastMessage) : null)
                .title(getRoomTitle(room))
                .customerName(customerName)
                .customerId(customerId)
                .pharmacistName(pharmacistName)
                .build();
    }

    private boolean canPharmacistAccessRoom(
            ChatConversationEntity room,
            PharmacistEntity currentPharmacist) {
        if (currentPharmacist == null) {
            return true;
        }

        if (room.getPharmacist() != null && room.getPharmacist().getId() != null) {
            return room.getPharmacist().getId().equals(currentPharmacist.getId());
        }

        return true;
    }

    private String normalizeConsultationId(String consultationId) {
        if (consultationId == null) {
            return null;
        }
        String normalized = consultationId.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        return normalized.toUpperCase(Locale.ROOT);
    }

    private String getRoomTitle(ChatConversationEntity room) {
        if (room.getTitle() != null && !room.getTitle().isBlank()) {
            return room.getTitle();
        }
        if ("AI".equals(room.getType()))
            return "AI Chatbot";

        if (room.getPharmacist() != null) {
            if (room.getPharmacist().getSpecialty() != null && room.getPharmacist().getSpecialty().getName() != null
                    && !room.getPharmacist().getSpecialty().getName().isBlank()) {
                return "Tư vấn Chuyên gia: " + room.getPharmacist().getSpecialty().getName();
            }
            return "Tư vấn Dược sĩ";
        }

        return "Tư vấn Dược sĩ";
    }

    private ChatMessageResponse mapToMessageResponse(ChatMessageEntity msg) {
        return ChatMessageResponse.builder()
                .id(msg.getId() != null ? msg.getId().toString() : null)
                .chatRoomId(msg.getChatRoomId() != null ? msg.getChatRoomId().toString() : null)
                .senderId(msg.getSenderId())
                .senderType(msg.getSenderType())
                .content(msg.getContent())
                .type(msg.getType())
                .status(msg.getStatus())
                .createdAt(msg.getCreatedAt())
                .build();
    }

    private AccessContext requireRoomAccessForCurrentUser(String roomId) {
        parseRoomId(roomId);
        try {
            UUID userId = securityUtils.getCurrentUserId();
            boolean isPharmacist = securityUtils.hasRole("PHARMACIST");
            return new AccessContext(userId, isPharmacist);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Unauthorized chat access");
        }
    }

    private String resolveSenderType(SendMessageRequest req, ChatConversationEntity room, AccessContext accessContext) {
        String requestedSenderType = req != null ? req.getSenderType() : null;
        if ("AI".equalsIgnoreCase(requestedSenderType) && "AI".equals(room.getType())) {
            return "AI";
        }
        return accessContext.isPharmacist() ? "PHARMACIST" : "CUSTOMER";
    }

    private UUID parseRoomId(String roomId) {
        try {
            return UUID.fromString(roomId);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid room id");
        }
    }

    private record AccessContext(UUID userId, boolean isPharmacist) {
    }
}
