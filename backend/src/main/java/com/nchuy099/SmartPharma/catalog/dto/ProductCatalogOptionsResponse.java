package com.nchuy099.SmartPharma.catalog.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductCatalogOptionsResponse {
    List<CatalogOptionResponse> brands;
    List<CatalogOptionResponse> brandOrigins;
    List<CatalogOptionResponse> ingredients;
    List<CatalogOptionResponse> unitTypes;
}
