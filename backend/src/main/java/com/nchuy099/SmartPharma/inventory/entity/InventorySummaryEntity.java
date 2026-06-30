package com.nchuy099.SmartPharma.inventory.entity;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
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

@Entity
@Table(name = "inventories")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventorySummaryEntity extends AbstractEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false, unique = true)
    ProductVariantEntity variant;

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

    @Transient
    public Integer getQuantityAvailable() {
        return quantityOnHand - quantityReserved;
    }

    public void syncFromLots(int quantityOnHand, int quantityReserved) {
        this.quantityOnHand = quantityOnHand;
        this.quantityReserved = quantityReserved;
    }
}
