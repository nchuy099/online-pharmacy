package com.nchuy099.SmartPharma.product.entity;

import java.math.BigDecimal;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventorySummaryEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "product_variants")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductVariantEntity extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    ProductEntity product;

    @Column(nullable = false, unique = true)
    String sku;

    @Column(name = "unit_type", nullable = false)
    String unitType;
    @Column(columnDefinition = "TEXT")
    String specification;

    @Column(nullable = false)
    BigDecimal salePrice;

    @Column(nullable = false)
    @Builder.Default
    BigDecimal discountPercent = BigDecimal.ZERO;

    BigDecimal latestImportCost;

    BigDecimal averageCost;

    @Column(nullable = false)
    @Builder.Default
    Boolean isDefault = false;

    @Column(nullable = false)
    @Builder.Default
    Boolean isActive = true;

    @OneToOne(mappedBy = "variant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    InventorySummaryEntity inventory;

    public InventorySummaryEntity getInventorySummary() {
        return inventory;
    }

    public void setInventorySummary(InventorySummaryEntity inventory) {
        this.inventory = inventory;
    }

    public String getUnit() {
        return unitType;
    }

    public void setUnit(String unit) {
        this.unitType = unit;
    }
}
