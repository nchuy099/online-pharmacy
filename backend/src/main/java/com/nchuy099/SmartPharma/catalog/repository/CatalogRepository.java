package com.nchuy099.SmartPharma.catalog.repository;

import com.nchuy099.SmartPharma.catalog.entity.CatalogEntity;
import com.nchuy099.SmartPharma.catalog.entity.CatalogType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatalogRepository extends JpaRepository<CatalogEntity, UUID> {
    List<CatalogEntity> findByTypeAndIsActiveTrueOrderByNameAsc(CatalogType type);

    List<CatalogEntity> findByTypeAndParentIdAndIsActiveTrueOrderByNameAsc(CatalogType type, UUID parentId);

    Optional<CatalogEntity> findByTypeAndCode(CatalogType type, String code);

    Optional<CatalogEntity> findByTypeAndId(CatalogType type, UUID id);

    boolean existsByTypeAndCode(CatalogType type, String code);

    @Query("""
            SELECT c
            FROM CatalogEntity c
            WHERE c.type = :type
              AND (
                LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(c.code) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """)
    Page<CatalogEntity> searchByType(
            @Param("type") CatalogType type,
            @Param("search") String search,
            Pageable pageable);

    Page<CatalogEntity> findByType(CatalogType type, Pageable pageable);

    long countByType(CatalogType type);
}
