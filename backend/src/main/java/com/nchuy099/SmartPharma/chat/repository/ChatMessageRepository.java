package com.nchuy099.SmartPharma.chat.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.chat.entity.ChatMessageEntity;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, UUID> {

    Page<ChatMessageEntity> findByChatRoomIdOrderByCreatedAtDesc(UUID chatRoomId, Pageable pageable);

    long countByChatRoomId(UUID chatRoomId);

    List<ChatMessageEntity> findByChatRoomIdAndStatusAndSenderIdNot(UUID chatRoomId, String status,
            String senderId);
}
