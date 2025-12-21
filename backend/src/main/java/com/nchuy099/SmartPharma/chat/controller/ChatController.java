package com.nchuy099.SmartPharma.chat.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.chat.dto.request.CreateRoomRequest;
import com.nchuy099.SmartPharma.chat.dto.request.ChatAiRequest;
import com.nchuy099.SmartPharma.chat.dto.response.ChatMessageResponse;
import com.nchuy099.SmartPharma.chat.dto.response.ChatRoomResponse;
import com.nchuy099.SmartPharma.chat.service.ChatService;
import com.nchuy099.SmartPharma.catalog.dto.CatalogOptionResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/chat/rooms")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ChatRoomResponse createRoom(@RequestBody CreateRoomRequest request) {
        log.info("Create chat room request received");
        return chatService.createRoom(request);
    }

    @GetMapping("/chat/rooms/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    public List<ChatRoomResponse> getMyRooms() {
        log.info("Get my chat rooms request received");
        return chatService.getMyRooms();
    }

    @GetMapping("/chat/rooms/{roomId}/messages")
    @PreAuthorize("hasRole('CUSTOMER')")
    public Page<ChatMessageResponse> getRoomMessages(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        log.info("Get chat room messages request received roomId={} page={} size={}", roomId, page, size);
        return chatService.getMessages(roomId, page, size);
    }

    @GetMapping("/chat/specialties")
    public List<CatalogOptionResponse> getConsultationSpecialties() {
        log.info("Get consultation specialties request received");
        return chatService.getConsultationSpecialties();
    }

    @PostMapping("/chat/ai")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ChatMessageResponse aiChat(@RequestBody ChatAiRequest request) {
        log.info("AI chat request conversationId={}", request.getConversationId());
        return chatService.handleAiChat(request.getConversationId(), request.getMessage());
    }
}
