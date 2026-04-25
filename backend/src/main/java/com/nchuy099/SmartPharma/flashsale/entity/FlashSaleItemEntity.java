package com.nchuy099.SmartPharma.flashsale.entity;

import java.math.BigDecimal;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleItemStatus;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "flash_sale_items")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FlashSaleItemEntity extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    FlashSaleCampaignEntity campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    ProductVariantEntity variant;

    @Column(nullable = false)
    BigDecimal flashPrice;

    @Column(nullable = false)
    BigDecimal originalPrice;

    @Column(nullable = false)
    Integer saleStock;

    @Column(nullable = false)
    @Builder.Default
    Integer perUserLimit = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    FlashSaleItemStatus status = FlashSaleItemStatus.DRAFT;
}
