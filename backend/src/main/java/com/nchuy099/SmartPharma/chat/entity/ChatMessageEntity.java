package com.nchuy099.SmartPharma.chat.entity;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessageEntity extends AbstractEntity {

    @Column(name = "chat_room_id", nullable = false)
    java.util.UUID chatRoomId;

    @Column(name = "sender_id", nullable = false, length = 100)
    String senderId;

    @Column(name = "sender_type", nullable = false, length = 30)
    String senderType; // CUSTOMER | PHARMACIST | AI | SYSTEM

    @Column(nullable = false, columnDefinition = "TEXT")
    String content;

    @Builder.Default
    @Column(nullable = false, length = 30)
    String type = "TEXT"; // TEXT | IMAGE | FILE | SYSTEM

    @Builder.Default
    @Column(nullable = false, length = 30)
    String status = "SENT"; // SENT | DELIVERED | READ
}
