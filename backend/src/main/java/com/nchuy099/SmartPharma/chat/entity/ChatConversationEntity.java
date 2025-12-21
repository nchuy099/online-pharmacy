package com.nchuy099.SmartPharma.chat.entity;

import java.util.UUID;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.user.entity.PharmacistEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "chat_conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatConversationEntity extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pharmacist_id")
    PharmacistEntity pharmacist;

    @Column(nullable = false)
    String type; // PHARMACIST | AI

    @Column(nullable = false)
    @Builder.Default
    String status = "ACTIVE"; // ACTIVE | CLOSED

    @Column(unique = true)
    String chatRoomId; // Legacy external room key (nullable)

    @Column(name = "consultation_id", length = 100)
    String consultationId; // Specialty code selected by customer

    @Column(columnDefinition = "TEXT")
    String lastMessage;

    @Column(columnDefinition = "TEXT")
    String title;

    @Column(columnDefinition = "TEXT")
    String summary;

    @Column(name = "title_generated", nullable = false)
    @Builder.Default
    boolean titleGenerated = false;

}
