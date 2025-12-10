package com.nchuy099.SmartPharma.catalog.service;

import com.nchuy099.SmartPharma.catalog.dto.CatalogOptionResponse;
import com.nchuy099.SmartPharma.catalog.entity.CatalogEntity;
import com.nchuy099.SmartPharma.catalog.entity.CatalogType;
import com.nchuy099.SmartPharma.catalog.repository.CatalogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationService {
    private final CatalogRepository catalogRepository;

    public List<CatalogOptionResponse> getAllProvinces() {
        return catalogRepository.findByTypeAndIsActiveTrueOrderByNameAsc(CatalogType.PROVINCE)
                .stream()
                .map(this::toCatalogOption)
                .toList();
    }

    public List<CatalogOptionResponse> getDistrictsByProvinceCode(String provinceCode) {
        return catalogRepository.findByTypeAndCode(CatalogType.PROVINCE, provinceCode)
                .map(province -> catalogRepository.findByTypeAndParentIdAndIsActiveTrueOrderByNameAsc(
                        CatalogType.DISTRICT,
                        province.getId()
                ))
                .orElse(Collections.emptyList())
                .stream()
                .map(this::toCatalogOption)
                .toList();
    }

    public List<CatalogOptionResponse> getWardsByDistrictCode(String districtCode) {
        return catalogRepository.findByTypeAndCode(CatalogType.DISTRICT, districtCode)
                .map(district -> catalogRepository.findByTypeAndParentIdAndIsActiveTrueOrderByNameAsc(
                        CatalogType.WARD,
                        district.getId()
                ))
                .orElse(Collections.emptyList())
                .stream()
                .map(this::toCatalogOption)
                .toList();
    }

    private CatalogOptionResponse toCatalogOption(CatalogEntity entity) {
        CatalogEntity parent = entity.getParent();
        return CatalogOptionResponse.builder()
                .id(entity.getId().toString())
                .type(entity.getType())
                .code(entity.getCode())
                .name(entity.getName())
                .parentId(parent != null ? parent.getId().toString() : null)
                .parentCode(parent != null ? parent.getCode() : null)
                .parentName(parent != null ? parent.getName() : null)
                .build();
    }
}
