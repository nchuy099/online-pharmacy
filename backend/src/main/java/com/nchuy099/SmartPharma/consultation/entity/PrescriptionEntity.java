package com.nchuy099.SmartPharma.consultation.entity;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.chat.entity.ChatConversationEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "prescriptions")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PrescriptionEntity extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    UserEntity customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pharmacist_id", nullable = false)
    UserEntity pharmacist;

    @Column(columnDefinition = "TEXT", nullable = false)
    String diagnosis;

    @Column(columnDefinition = "TEXT")
    String generalInstructions;

    @Column
    Instant followUpDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_conversation_id")
    ChatConversationEntity chatConversation;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    Set<PrescriptionItemEntity> items = new HashSet<>();

    public void addItem(PrescriptionItemEntity item) {
        items.add(item);
        item.setPrescription(this);
    }
}
