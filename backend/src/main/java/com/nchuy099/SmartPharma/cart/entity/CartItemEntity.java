package com.nchuy099.SmartPharma.cart.entity;

import java.math.BigDecimal;
import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;

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
import lombok.extern.slf4j.Slf4j;

@Entity
@Table(name = "cart_items")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartItemEntity extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    CartEntity cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    ProductVariantEntity variant;

    @Column(nullable = false)
    @Builder.Default
    Integer quantity = 0;

    @Column(nullable = false)
    @Builder.Default
    Boolean selected = true;

    public BigDecimal calculateLineTotal() {
        return this.variant.getSalePrice().multiply(BigDecimal.valueOf(this.quantity));
    }

    public void removeFromCart() {
        if (this.cart == null)
            return;
        this.cart.removeItem(this);
    }
}
