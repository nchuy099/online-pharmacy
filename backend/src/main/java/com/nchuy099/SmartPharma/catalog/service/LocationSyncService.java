package com.nchuy099.SmartPharma.catalog.service;

import com.nchuy099.SmartPharma.catalog.entity.CatalogEntity;
import com.nchuy099.SmartPharma.catalog.entity.CatalogType;
import com.nchuy099.SmartPharma.catalog.repository.CatalogRepository;
import com.nchuy099.SmartPharma.order.ghn.GHNClient;
import com.nchuy099.SmartPharma.order.ghn.dto.DistrictDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.ProvinceDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.WardDTO;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationSyncService {
    private static final int DB_BATCH_SIZE = 500;

    private final GHNClient ghnClient;
    private final CatalogRepository catalogRepository;

    @Transactional
    public void syncLocations() {
        if (catalogRepository.countByType(CatalogType.PROVINCE) > 0) {
            log.info("Locations already synced in catalogs, skipping.");
            return;
        }

        log.info("Starting location sync from GHN into catalogs...");
        List<ProvinceDTO> provinces = ghnClient.getProvinces();
        if (provinces == null || provinces.isEmpty()) {
            log.warn("No provinces fetched from GHN. Skip location sync.");
            return;
        }

        List<CatalogEntity> provinceEntities = new ArrayList<>();
        List<CatalogEntity> districtEntities = new ArrayList<>();
        List<CatalogEntity> wardEntities = new ArrayList<>();

        for (ProvinceDTO provinceDto : provinces) {
            CatalogEntity province = buildCatalog(
                    CatalogType.PROVINCE,
                    String.valueOf(provinceDto.getProvinceId()),
                    provinceDto.getProvinceName(),
                    null
            );
            provinceEntities.add(province);

            List<DistrictDTO> districts = ghnClient.getDistricts(provinceDto.getProvinceId());
            if (districts == null) {
                log.warn("Districts list for province {} is null", provinceDto.getProvinceName());
                continue;
            }

            for (DistrictDTO districtDto : districts) {
                CatalogEntity district = buildCatalog(
                        CatalogType.DISTRICT,
                        String.valueOf(districtDto.getDistrictId()),
                        districtDto.getDistrictName(),
                        province
                );
                districtEntities.add(district);

                List<WardDTO> wards = ghnClient.getWards(districtDto.getDistrictId());
                if (wards == null) {
                    log.warn("Wards list for district {} is null", districtDto.getDistrictName());
                    continue;
                }

                for (WardDTO wardDto : wards) {
                    wardEntities.add(buildCatalog(
                            CatalogType.WARD,
                            wardDto.getWardCode(),
                            wardDto.getWardName(),
                            district
                    ));
                }
            }
        }

        saveInBatches(provinceEntities);
        saveInBatches(districtEntities);
        saveInBatches(wardEntities);

        log.info(
                "Location sync completed: provinces={}, districts={}, wards={}",
                provinceEntities.size(),
                districtEntities.size(),
                wardEntities.size()
        );
    }

    private CatalogEntity buildCatalog(CatalogType type, String code, String name, CatalogEntity parent) {
        return CatalogEntity.builder()
                .type(type)
                .code(code)
                .name(name)
                .parent(parent)
                .isActive(true)
                .build();
    }

    private void saveInBatches(List<CatalogEntity> entities) {
        if (entities.isEmpty()) {
            return;
        }

        for (int start = 0; start < entities.size(); start += DB_BATCH_SIZE) {
            int end = Math.min(start + DB_BATCH_SIZE, entities.size());
            List<CatalogEntity> batch = entities.subList(start, end);
            catalogRepository.saveAll(batch);
            catalogRepository.flush();
        }
    }
}
