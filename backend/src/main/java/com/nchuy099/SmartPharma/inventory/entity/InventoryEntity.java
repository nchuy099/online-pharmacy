package com.nchuy099.SmartPharma.inventory.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.inventory.domain.enums.TransactionType;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Entity
@Table(name = "inventories")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryEntity extends AbstractEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false, unique = true)
    private ProductVariantEntity variant;

    @Column(nullable = false)
    @Builder.Default
    Integer reorderLevel = 0;

    @Column(nullable = false)
    @Builder.Default
    Integer safetyStock = 0;

    @Column(nullable = false)
    @Builder.Default
    Integer quantityOnHand = 0;

    @Column(nullable = false)
    @Builder.Default
    Integer quantityReserved = 0;

    @OneToMany(mappedBy = "inventory", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<InventoryTransactionEntity> transactions = new ArrayList<>();

    @Transient
    public Integer getQuantityAvailable() {
        return quantityOnHand - quantityReserved;
    }

    public void ensureAvailable(int qty) {
        if (getQuantityAvailable() < qty) {
            log.warn("Product stock not enough to proceed");
            throw new AppException(ErrorCode.CONFLICT, "Product stock not enough to proceed");

        }
    }

    public void ensureReserved(int qty) {
        if (quantityReserved < qty) {
            log.warn("Product stock not enough to reserve");
            throw new AppException(ErrorCode.CONFLICT, "Product stock not enough to reserve");

        }
    }

    public void reserve(Integer quantity) {
        if (quantity <= 0) {
            log.warn("Quantity must be > 0");
            throw new AppException(ErrorCode.CONFLICT, "Quantity must be > 0");
        }
        if (getQuantityAvailable() < quantity) {
            log.warn("Not enough stock to reserve");
            throw new AppException(ErrorCode.CONFLICT, "Not enough stock to reserve");
        }
        this.quantityReserved += quantity;
        addTransaction(quantity, TransactionType.RESERVE, null, "Reserve Stock");
    }

    public void importStock(Integer quantity, BigDecimal unitCost, String note) {
        this.quantityOnHand += quantity;
        addTransaction(quantity, TransactionType.IMPORT, determineUnitCost(unitCost), note);
    }

    public void exportStock(Integer quantity) {

        if (quantity <= 0) {
            log.warn("Quantity must be > 0");
            throw new AppException(ErrorCode.CONFLICT, "Quantity must be > 0");
        }
        if (quantityReserved < quantity) {
            log.warn("Not enough reserved stock to export");
            throw new AppException(ErrorCode.CONFLICT, "Not enough reserved stock to export");
        }
        this.quantityReserved -= quantity;
        this.quantityOnHand -= quantity;
        addTransaction(quantity, TransactionType.EXPORT, null, "Export stock");
    }

    public void releaseReservation(Integer quantity) {
        if (quantityReserved < quantity) {
            log.warn("Not enough reserved stock to release");
            throw new AppException(ErrorCode.CONFLICT, "Not enough reserved stock to release");
        }
        this.quantityReserved -= quantity;
        addTransaction(quantity, TransactionType.RELEASE, null, "Release reserved stock");
    }

    private void addTransaction(int quantity, TransactionType type, BigDecimal unitCost, String note) {
        BigDecimal finalCost = (type == TransactionType.IMPORT) ? unitCost : null;
        this.transactions.add(
                InventoryTransactionEntity.builder()
                        .inventory(this)
                        .quantity(quantity)
                        .type(type)
                        .unitCost(finalCost)
                        .note(note)
                        .build());
    }

    private BigDecimal determineUnitCost(BigDecimal providedCost) {
        if (providedCost != null && providedCost.compareTo(BigDecimal.ZERO) >= 0)
            return providedCost;

        // Try to get from product price only if absolutely no cost provided and we're importing?
        // Actually, just return ZERO if not provided by now, let addTransaction handle it.
        return BigDecimal.ZERO;
    }

}
