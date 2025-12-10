package com.nchuy099.SmartPharma.catalog;

import com.nchuy099.SmartPharma.catalog.dto.CatalogOptionResponse;
import com.nchuy099.SmartPharma.catalog.service.LocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/catalogs/locations")
@RequiredArgsConstructor
@Slf4j
public class LocationController {
    private final LocationService locationService;

    @GetMapping("/provinces")
    public List<CatalogOptionResponse> getProvinces() {
        log.info("Fetching province catalogs");
        return locationService.getAllProvinces();
    }

    @GetMapping("/districts")
    public List<CatalogOptionResponse> getDistricts(@RequestParam String provinceCode) {
        log.info("Fetching district catalogs for provinceCode: {}", provinceCode);
        return locationService.getDistrictsByProvinceCode(provinceCode);
    }

    @GetMapping("/wards")
    public List<CatalogOptionResponse> getWards(@RequestParam String districtCode) {
        log.info("Fetching ward catalogs for districtCode: {}", districtCode);
        return locationService.getWardsByDistrictCode(districtCode);
    }
}
