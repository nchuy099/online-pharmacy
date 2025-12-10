package com.nchuy099.SmartPharma.catalog.service;

import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.catalog.entity.CatalogEntity;
import com.nchuy099.SmartPharma.catalog.entity.CatalogType;
import com.nchuy099.SmartPharma.catalog.repository.CatalogRepository;
import com.nchuy099.SmartPharma.catalog.dto.SpecialtyListResponse;
import com.nchuy099.SmartPharma.catalog.dto.SpecialtyResponse;
import com.nchuy099.SmartPharma.common.dto.Pagination;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class CatalogSpecialtyService {

    private final CatalogRepository catalogRepository;

    public SpecialtyListResponse getSpecialtyList(int page, int size, String search) {
        log.info("Get specialty list, page: {}, size: {}, search: {}", page, size, search);
        if (page > 0) {
            page--;
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<CatalogEntity> specialties = (search == null || search.isBlank())
                ? catalogRepository.findByType(CatalogType.SPECIALTY, pageable)
                : catalogRepository.searchByType(CatalogType.SPECIALTY, search.trim(), pageable);

        return SpecialtyListResponse.builder()
                .specialties(specialties.getContent().stream()
                        .map(this::mapToResponse)
                        .collect(Collectors.toList()))
                .pagination(Pagination.builder()
                        .page(page + 1)
                        .size(size)
                        .totalElements(specialties.getTotalElements())
                        .totalPages(specialties.getTotalPages())
                        .build())
                .build();
    }

    private SpecialtyResponse mapToResponse(CatalogEntity entity) {
        return SpecialtyResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .build();
    }
}
