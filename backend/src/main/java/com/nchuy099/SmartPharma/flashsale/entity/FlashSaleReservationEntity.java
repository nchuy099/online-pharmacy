package com.nchuy099.SmartPharma.flashsale.entity;

import java.time.Instant;
import java.util.UUID;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleReservationStatus;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "flash_sale_reservations")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FlashSaleReservationEntity extends AbstractEntity {

    @Column(nullable = false, unique = true)
    UUID reservationToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    FlashSaleItemEntity item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    UserEntity user;

    @Column(nullable = false)
    Integer quantity;

    @Column(nullable = false)
    String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    FlashSaleReservationStatus status = FlashSaleReservationStatus.HELD;

    @Column(nullable = false)
    Instant expiresAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    OrderEntity order;
}
