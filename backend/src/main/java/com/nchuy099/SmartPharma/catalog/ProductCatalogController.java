package com.nchuy099.SmartPharma.catalog;

import com.nchuy099.SmartPharma.catalog.dto.CatalogOptionResponse;
import com.nchuy099.SmartPharma.catalog.dto.ProductCatalogOptionsResponse;
import com.nchuy099.SmartPharma.catalog.entity.CatalogType;
import com.nchuy099.SmartPharma.catalog.service.ProductCatalogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/catalogs")
@RequiredArgsConstructor
@Slf4j
public class ProductCatalogController {

    private final ProductCatalogService productCatalogService;

    @GetMapping("/options")
    public List<CatalogOptionResponse> getCatalogByType(@RequestParam CatalogType type) {
        log.info("Get catalog options by type: {}", type);
        return productCatalogService.getByType(type);
    }

    @GetMapping("/product-options")
    public ProductCatalogOptionsResponse getProductCatalogOptions() {
        log.info("Get grouped product catalog options");
        return productCatalogService.getProductCatalogOptions();
    }
}
