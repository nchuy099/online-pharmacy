package com.nchuy099.SmartPharma.product.dto.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductResponse {
    String id;
    String code;
    String slug;
    String name;
    String webName;
    String primaryImage;
    List<String> secondaryImages;
    String brand;
    String brandOrigin;
    String producer;
    String description;
    String careful;
    String adverseEffect;
    String preservation;
    List<VariantResponse> variants;
    Boolean isActive;
    List<IngredientResponse> ingredient;
    String usage;
    String dosage;
    List<CategoryResponse> categories;
    Integer quantityAvailable;
    Integer quantityOnHand;
    Double averageRating;
    Long totalReviews;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class VariantResponse {
        String id;
        String sku;
        String unitType;
        String specification;
        BigDecimal salePrice;
        BigDecimal discountPercent;
        Boolean isDefault;
        Boolean isActive;
        Integer quantityAvailable;
        Integer quantityOnHand;
        FlashSaleSummaryResponse flashSale;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class FlashSaleSummaryResponse {
        String id;
        String campaignId;
        String campaignName;
        BigDecimal flashPrice;
        BigDecimal originalPrice;
        Integer remainingStock;
        Integer saleStock;
        Integer perUserLimit;
        java.time.Instant startAt;
        java.time.Instant endAt;
        String status;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class IngredientResponse {
        Long ingredientId;
        String name;
        String shortDescription;
    }
}
