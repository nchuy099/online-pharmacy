package com.nchuy099.SmartPharma.product.dto.request;

import java.math.BigDecimal;

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
public class CreateProductVariantRequest {
    String unitType;
    String unit;
    String specification;
    BigDecimal salePrice;
    BigDecimal discountPercent;
    Boolean isDefault;
    Boolean isActive;
}
