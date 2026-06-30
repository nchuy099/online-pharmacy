package com.nchuy099.SmartPharma.inventory.entity;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryLotStatus;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(
        name = "inventory_lots",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_inventory_lots_variant_lot_expiry",
                columnNames = { "variant_id", "lot_number", "expiry_date" }))
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryLotEntity extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    ProductVariantEntity variant;

    @Column(name = "lot_number", nullable = false)
    String lotNumber;

    @Column(name = "expiry_date", nullable = false)
    LocalDate expiryDate;

    @Column(name = "received_at", nullable = false)
    Instant receivedAt;

    @Column(name = "quantity_on_hand", nullable = false)
    @Builder.Default
    Integer quantityOnHand = 0;

    @Column(name = "quantity_reserved", nullable = false)
    @Builder.Default
    Integer quantityReserved = 0;

    @Column(name = "unit_cost")
    BigDecimal unitCost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    InventoryLotStatus status = InventoryLotStatus.ACTIVE;

    public int getQuantityAvailable() {
        return quantityOnHand - quantityReserved;
    }

    public boolean isSellable(LocalDate today) {
        return status == InventoryLotStatus.ACTIVE
                && expiryDate != null
                && expiryDate.isAfter(today)
                && getQuantityAvailable() > 0;
    }

    public void importStock(int quantity, BigDecimal unitCost) {
        validatePositive(quantity);
        this.quantityOnHand += quantity;
        if (unitCost != null) {
            this.unitCost = unitCost;
        }
        if (this.status == InventoryLotStatus.DEPLETED && this.quantityOnHand > 0) {
            this.status = InventoryLotStatus.ACTIVE;
        }
    }

    public void reserve(int quantity) {
        validatePositive(quantity);
        if (getQuantityAvailable() < quantity) {
            throw new AppException(ErrorCode.CONFLICT, "Not enough stock to reserve");
        }
        this.quantityReserved += quantity;
    }

    public void release(int quantity) {
        validatePositive(quantity);
        if (quantityReserved < quantity) {
            throw new AppException(ErrorCode.CONFLICT, "Not enough reserved stock to release");
        }
        this.quantityReserved -= quantity;
    }

    public void exportReserved(int quantity) {
        validatePositive(quantity);
        if (quantityReserved < quantity || quantityOnHand < quantity) {
            throw new AppException(ErrorCode.CONFLICT, "Not enough reserved stock to export");
        }
        this.quantityReserved -= quantity;
        this.quantityOnHand -= quantity;
        if (this.quantityOnHand == 0) {
            this.status = InventoryLotStatus.DEPLETED;
        }
    }

    public void adjustStock(int quantityOnHand, int quantityReserved) {
        if (quantityOnHand < 0 || quantityReserved < 0 || quantityReserved > quantityOnHand) {
            throw new AppException(ErrorCode.CONFLICT, "Invalid inventory lot quantities");
        }
        this.quantityOnHand = quantityOnHand;
        this.quantityReserved = quantityReserved;
        if (this.quantityOnHand == 0 && this.status == InventoryLotStatus.ACTIVE) {
            this.status = InventoryLotStatus.DEPLETED;
        }
    }

    private void validatePositive(int quantity) {
        if (quantity <= 0) {
            throw new AppException(ErrorCode.CONFLICT, "Quantity must be > 0");
        }
    }
}
