package com.nchuy099.SmartPharma.chat.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.chat.dto.response.ChatMessageResponse;
import com.nchuy099.SmartPharma.chat.dto.response.ChatRoomResponse;
import com.nchuy099.SmartPharma.chat.service.ChatService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/pharmacists/chat")
@Slf4j
@RequiredArgsConstructor
public class PharmacistChatController {

    private final ChatService chatService;

    @GetMapping("/rooms/active")
    @PreAuthorize("hasRole('PHARMACIST')")
    public List<ChatRoomResponse> getActiveRooms() {
        log.info("Get active chat rooms request received for pharmacist");
        return chatService.getActiveRooms();
    }

    @PostMapping("/rooms/{roomId}/join")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ChatRoomResponse joinRoom(@PathVariable String roomId) {
        log.info("Join chat room request received for pharmacist: {}", roomId);
        return chatService.joinRoom(roomId);
    }

    @PostMapping("/rooms/{roomId}/close")
    @PreAuthorize("hasRole('PHARMACIST')")
    public void closeRoom(@PathVariable String roomId) {
        log.info("Close chat room request received for pharmacist: {}", roomId);
        chatService.closeRoom(roomId);
    }

    @GetMapping("/rooms/{roomId}/messages")
    @PreAuthorize("hasRole('PHARMACIST')")
    public Page<ChatMessageResponse> getRoomMessages(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        log.info("Get room messages request received for pharmacist roomId={} page={} size={}", roomId, page, size);
        return chatService.getMessages(roomId, page, size);
    }
}
