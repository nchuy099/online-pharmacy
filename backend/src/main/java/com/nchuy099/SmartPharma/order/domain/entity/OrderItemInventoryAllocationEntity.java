package com.nchuy099.SmartPharma.order.domain.entity;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.inventory.entity.InventoryLotEntity;
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
@Table(name = "order_item_inventory_allocations")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemInventoryAllocationEntity extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    OrderItemEntity orderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lot_id", nullable = false)
    InventoryLotEntity lot;

    @Column(name = "reserved_quantity", nullable = false)
    Integer reservedQuantity;

    @Column(name = "exported_quantity", nullable = false)
    @Builder.Default
    Integer exportedQuantity = 0;

    public void markExported(int quantity) {
        if (quantity <= 0) {
            throw new AppException(ErrorCode.CONFLICT, "Quantity must be > 0");
        }
        if (exportedQuantity + quantity > reservedQuantity) {
            throw new AppException(ErrorCode.CONFLICT, "Export quantity exceeds reserved quantity");
        }
        this.exportedQuantity += quantity;
    }

    public int getRemainingReservedQuantity() {
        return reservedQuantity - exportedQuantity;
    }
}
