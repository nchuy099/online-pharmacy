package com.nchuy099.SmartPharma.inventory.repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.inventory.entity.InventoryTransactionEntity;
import com.nchuy099.SmartPharma.inventory.domain.enums.TransactionType;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransactionEntity, UUID> {
    @Query(value = """
            SELECT t FROM InventoryTransactionEntity t
            JOIN FETCH t.inventory i
            JOIN FETCH i.variant v
            JOIN FETCH v.product p
            WHERE i.id = :inventoryId
            """, countQuery = """
            SELECT count(t) FROM InventoryTransactionEntity t
            JOIN t.inventory i
            JOIN i.variant v
            JOIN v.product p
            WHERE i.id = :inventoryId
            """)
    Page<InventoryTransactionEntity> findByInventoryId(@Param("inventoryId") UUID inventoryId, Pageable pageable);

    Optional<InventoryTransactionEntity> findTopByInventoryVariantIdAndTypeOrderByCreatedAtDesc(UUID variantId, TransactionType type);

    interface AverageImportCostProjection {
        UUID getVariantId();

        BigDecimal getAverageImportCost();
    }

    @Query("""
            SELECT v.id as variantId,
                   COALESCE(
                       SUM(COALESCE(t.unitCost, 0) * t.quantity) / NULLIF(SUM(t.quantity), 0),
                       0
                   ) as averageImportCost
            FROM InventoryTransactionEntity t
            JOIN t.inventory i
            JOIN i.variant v
            WHERE t.type = com.nchuy099.SmartPharma.inventory.domain.enums.TransactionType.IMPORT
              AND v.id IN :variantIds
            GROUP BY v.id
            """)
    List<AverageImportCostProjection> findAverageImportCostsByVariantIds(@Param("variantIds") Collection<UUID> variantIds);

    @Query("""
            SELECT SUM(COALESCE(t.unitCost, 0) * t.quantity) / NULLIF(SUM(t.quantity), 0)
            FROM InventoryTransactionEntity t
            JOIN t.inventory i
            JOIN i.variant v
            WHERE t.type = com.nchuy099.SmartPharma.inventory.domain.enums.TransactionType.IMPORT
              AND v.id = :variantId
            """)
    BigDecimal findAverageImportCostByVariantId(@Param("variantId") UUID variantId);

    @Query(value = """
            SELECT t FROM InventoryTransactionEntity t
            JOIN FETCH t.inventory i
            JOIN FETCH i.variant v
            JOIN FETCH v.product p
            WHERE p.id = :productId
            """, countQuery = """
            SELECT count(t) FROM InventoryTransactionEntity t
            JOIN t.inventory i
            JOIN i.variant v
            JOIN v.product p
            WHERE p.id = :productId
            """)
    Page<InventoryTransactionEntity> findByProductId(@Param("productId") UUID productId, Pageable pageable);
}
