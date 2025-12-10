package com.nchuy099.SmartPharma.product.dto.request;

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
public class CreateProductRequest {
    String name;
    String webName;
    String slug;
    String primaryImage;
    List<String> secondaryImages;
    String brand;
    String brandOrigin;
    String producer;
    String description;
    String careful;
    String adverseEffect;
    String preservation;
    List<VariantRequest> variants;
    List<IngredientRequest> ingredient;
    String usage;
    String dosage;
    List<String> categoryIds;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class VariantRequest {
        String id;
        String sku;
        String unitType;
        String unit;
        String specification;
        BigDecimal salePrice;
        BigDecimal discountPercent;
        Boolean isDefault;
        Boolean isActive;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class IngredientRequest {
        Long ingredientId;
        String name;
        String shortDescription;
    }
}
