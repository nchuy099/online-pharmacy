package com.nchuy099.SmartPharma.catalog;

import com.nchuy099.SmartPharma.catalog.entity.CatalogEntity;
import com.nchuy099.SmartPharma.catalog.entity.CatalogType;
import com.nchuy099.SmartPharma.catalog.repository.CatalogRepository;
import com.nchuy099.SmartPharma.catalog.service.LocationSyncService;
import com.nchuy099.SmartPharma.order.ghn.GHNClient;
import com.nchuy099.SmartPharma.order.ghn.dto.DistrictDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.ProvinceDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.WardDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LocationSyncServiceTest {

    @Mock
    private GHNClient ghnClient;

    @Mock
    private CatalogRepository catalogRepository;

    @InjectMocks
    private LocationSyncService locationSyncService;

    @Test
    void syncLocations_shouldInsertByBatchUsingSaveAll() {
        ProvinceDTO province = new ProvinceDTO();
        province.setProvinceId(1);
        province.setProvinceName("HCM");

        DistrictDTO district = new DistrictDTO();
        district.setDistrictId(10);
        district.setProvinceId(1);
        district.setDistrictName("District 1");

        WardDTO ward = new WardDTO();
        ward.setWardCode("001");
        ward.setDistrictId(10);
        ward.setWardName("Ben Nghe");

        when(catalogRepository.countByType(CatalogType.PROVINCE)).thenReturn(0L);
        when(ghnClient.getProvinces()).thenReturn(List.of(province));
        when(ghnClient.getDistricts(1)).thenReturn(List.of(district));
        when(ghnClient.getWards(10)).thenReturn(List.of(ward));
        when(catalogRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        locationSyncService.syncLocations();

        verify(catalogRepository, times(3)).saveAll(any());
        verify(catalogRepository, never()).save(any(CatalogEntity.class));

        ArgumentCaptor<Iterable<CatalogEntity>> captor = ArgumentCaptor.forClass(Iterable.class);
        verify(catalogRepository, times(3)).saveAll(captor.capture());

        List<CatalogEntity> allSaved = new ArrayList<>();
        for (Iterable<CatalogEntity> batch : captor.getAllValues()) {
            batch.forEach(allSaved::add);
        }

        assertThat(allSaved)
                .extracting(CatalogEntity::getType)
                .containsExactlyInAnyOrder(CatalogType.PROVINCE, CatalogType.DISTRICT, CatalogType.WARD);

        CatalogEntity savedDistrict = allSaved.stream()
                .filter(entity -> entity.getType() == CatalogType.DISTRICT)
                .findFirst()
                .orElseThrow();
        CatalogEntity savedWard = allSaved.stream()
                .filter(entity -> entity.getType() == CatalogType.WARD)
                .findFirst()
                .orElseThrow();

        assertThat(savedDistrict.getParent()).isNotNull();
        assertThat(savedDistrict.getParent().getType()).isEqualTo(CatalogType.PROVINCE);
        assertThat(savedWard.getParent()).isNotNull();
        assertThat(savedWard.getParent().getType()).isEqualTo(CatalogType.DISTRICT);
    }

    @Test
    void syncLocations_shouldSkipWhenAlreadySynced() {
        when(catalogRepository.countByType(CatalogType.PROVINCE)).thenReturn(2L);

        locationSyncService.syncLocations();

        verifyNoInteractions(ghnClient);
        verify(catalogRepository, never()).saveAll(any());
        verify(catalogRepository, never()).save(any(CatalogEntity.class));
    }
}
