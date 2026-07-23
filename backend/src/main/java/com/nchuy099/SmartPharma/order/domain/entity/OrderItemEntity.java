package com.nchuy099.SmartPharma.order.domain.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventoryReservationItemEntity;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.review.entity.ReviewEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Entity
@Table(name = "order_items")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemEntity extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    OrderEntity order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    ProductVariantEntity variant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    ProductEntity product;

    @Column(nullable = false)
    String snapshotProductName;

    @Column(nullable = false)
    String snapshotSku;

    @Column(nullable = false)
    String snapshotUnit;

    String snapshotPrimaryImage;

    @Column(nullable = false)
    Integer quantity;

    @Column(nullable = false)
    BigDecimal unitPrice;

    BigDecimal unitCost;

    @Column(nullable = false)
    BigDecimal totalPrice;

    @OneToOne(mappedBy = "orderItem", fetch = FetchType.EAGER)
    ReviewEntity review;

    @OneToMany(mappedBy = "orderItem", fetch = FetchType.LAZY)
    @Builder.Default
    List<InventoryReservationItemEntity> inventoryReservationItems = new ArrayList<>();

    public BigDecimal calculateTotalPrice() {
        if (this.totalPrice == null) {
            this.totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
        return this.totalPrice;
    }
}
