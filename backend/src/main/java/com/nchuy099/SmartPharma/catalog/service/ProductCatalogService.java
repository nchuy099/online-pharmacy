package com.nchuy099.SmartPharma.catalog.service;

import com.nchuy099.SmartPharma.catalog.dto.CatalogOptionResponse;
import com.nchuy099.SmartPharma.catalog.dto.ProductCatalogOptionsResponse;
import com.nchuy099.SmartPharma.catalog.entity.CatalogEntity;
import com.nchuy099.SmartPharma.catalog.entity.CatalogType;
import com.nchuy099.SmartPharma.catalog.repository.CatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductCatalogService {

    private final CatalogRepository catalogRepository;

    public List<CatalogOptionResponse> getByType(CatalogType type) {
        return catalogRepository.findByTypeAndIsActiveTrueOrderByNameAsc(type)
                .stream()
                .map(this::toOption)
                .toList();
    }

    public ProductCatalogOptionsResponse getProductCatalogOptions() {
        return ProductCatalogOptionsResponse.builder()
                .brands(getByType(CatalogType.BRAND))
                .brandOrigins(getByType(CatalogType.BRAND_ORIGIN))
                .ingredients(getByType(CatalogType.INGREDIENT))
                .unitTypes(getByType(CatalogType.UNIT_TYPE))
                .build();
    }

    private CatalogOptionResponse toOption(CatalogEntity entity) {
        CatalogEntity parent = entity.getParent();
        return CatalogOptionResponse.builder()
                .id(entity.getId().toString())
                .type(entity.getType())
                .code(entity.getCode())
                .name(entity.getName())
                .parentId(parent != null && parent.getId() != null ? parent.getId().toString() : null)
                .parentCode(parent != null ? parent.getCode() : null)
                .parentName(parent != null ? parent.getName() : null)
                .build();
    }
}
