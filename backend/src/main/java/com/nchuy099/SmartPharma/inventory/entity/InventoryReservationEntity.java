package com.nchuy099.SmartPharma.inventory.entity;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryReservationStatus;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryReservationType;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "inventory_reservations")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryReservationEntity extends AbstractEntity {

    @Column(name = "reservation_key", nullable = false, unique = true)
    String reservationKey;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    OrderEntity order;

    @Column(name = "reservation_type", nullable = false)
    @Enumerated(EnumType.STRING)
    InventoryReservationType reservationType;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    InventoryReservationStatus status = InventoryReservationStatus.PENDING;

    @Column(name = "expires_at")
    Instant expiresAt;

    @Column(name = "committed_at")
    Instant committedAt;

    @Column(name = "released_at")
    Instant releasedAt;

    @OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    List<InventoryReservationItemEntity> items = new ArrayList<>();

    public void addItem(InventoryReservationItemEntity item) {
        items.add(item);
        item.setReservation(this);
    }

    public void markReserved() {
        transition(InventoryReservationStatus.PENDING, InventoryReservationStatus.RESERVED, "reserve");
    }

    public void markCommitted() {
        transition(InventoryReservationStatus.RESERVED, InventoryReservationStatus.COMMITTED, "commit");
        committedAt = Instant.now();
    }

    public void markReleased() {
        transition(InventoryReservationStatus.RESERVED, InventoryReservationStatus.RELEASED, "release");
        releasedAt = Instant.now();
    }

    public void markExpired() {
        transition(InventoryReservationStatus.RESERVED, InventoryReservationStatus.EXPIRED, "expire");
        releasedAt = Instant.now();
    }

    public boolean isReserved() {
        return status == InventoryReservationStatus.RESERVED;
    }

    private void transition(InventoryReservationStatus source, InventoryReservationStatus target, String action) {
        if (status != source) {
            throw new AppException(ErrorCode.CONFLICT,
                    "Cannot " + action + " inventory reservation in " + status + " status");
        }
        status = target;
    }
}
