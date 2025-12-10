package com.nchuy099.SmartPharma.catalog;

import com.nchuy099.SmartPharma.catalog.dto.SpecialtyListResponse;
import com.nchuy099.SmartPharma.catalog.service.CatalogSpecialtyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/catalogs/specialties")
@Slf4j
@RequiredArgsConstructor
public class CatalogSpecialtyController {

    private final CatalogSpecialtyService specialtyService;

    @GetMapping("/list")
    public SpecialtyListResponse getSpecialtyList(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "search", required = false) String search) {
        log.info("Admin catalog request: get specialty list, page: {}, size: {}, search: {}", page, size, search);
        return specialtyService.getSpecialtyList(page, size, search);
    }

}
