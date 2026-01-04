package com.nchuy099.SmartPharma.event.entity;

import com.nchuy099.SmartPharma.event.enums.EventType;
import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "events")
public class EventEntity extends AbstractEntity {

    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType; // VIEW, CLICK, ADD_TO_CART, CHECKOUT, PURCHASE

    private UUID itemId; // Represents the product id

    private UUID sessionId; // Added for anonymous users (future-proofing)

    @Column(columnDefinition = "TEXT")
    private String metadata; // Store JSON string for source, rank, etc.

}
