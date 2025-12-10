package com.nchuy099.SmartPharma.product.dto.request;

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
public class UpdateProductRequest {
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
    List<CreateProductRequest.VariantRequest> variants;
    List<CreateProductRequest.IngredientRequest> ingredient;
    String usage;
    String dosage;
    List<String> categoryIds;
}
