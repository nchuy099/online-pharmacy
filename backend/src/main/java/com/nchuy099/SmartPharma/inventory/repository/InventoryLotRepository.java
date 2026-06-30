package com.nchuy099.SmartPharma.inventory.repository;

import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryLotStatus;
import com.nchuy099.SmartPharma.inventory.entity.InventoryLotEntity;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryLotRepository extends JpaRepository<InventoryLotEntity, UUID> {

    Optional<InventoryLotEntity> findByVariantIdAndLotNumberAndExpiryDate(UUID variantId, String lotNumber, LocalDate expiryDate);

    @Query("""
        SELECT l
        FROM InventoryLotEntity l
        JOIN FETCH l.variant v
        JOIN FETCH v.product p
        WHERE l.variant.id = :variantId
        ORDER BY l.expiryDate ASC, l.receivedAt ASC, l.id ASC
    """)
    List<InventoryLotEntity> findByVariantIdOrderByFefo(UUID variantId);

    @Query(value = """
        SELECT l
        FROM InventoryLotEntity l
        JOIN FETCH l.variant v
        JOIN FETCH v.product p
        WHERE l.variant.id = :variantId
          AND (:search IS NULL OR :search = ''
               OR LOWER(l.lotNumber) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(v.sku) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(p.webName) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:status IS NULL OR l.status = :status)
        """, countQuery = """
        SELECT count(l)
        FROM InventoryLotEntity l
        JOIN l.variant v
        JOIN v.product p
        WHERE l.variant.id = :variantId
          AND (:search IS NULL OR :search = ''
               OR LOWER(l.lotNumber) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(v.sku) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(p.webName) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:status IS NULL OR l.status = :status)
        """)
    Page<InventoryLotEntity> findPageByVariantId(
            @Param("variantId") UUID variantId,
            @Param("search") String search,
            @Param("status") InventoryLotStatus status,
            Pageable pageable);

    @Query("""
        SELECT l
        FROM InventoryLotEntity l
        WHERE l.variant.id = :variantId
          AND l.status = com.nchuy099.SmartPharma.inventory.domain.enums.InventoryLotStatus.ACTIVE
          AND l.expiryDate > CURRENT_DATE
          AND (l.quantityOnHand - l.quantityReserved) > 0
        ORDER BY l.expiryDate ASC, l.receivedAt ASC, l.id ASC
    """)
    List<InventoryLotEntity> findSellableLotsForFefo(UUID variantId);

    @Modifying(flushAutomatically = true)
    @Query("""
        UPDATE InventoryLotEntity l
        SET l.quantityReserved = l.quantityReserved + :quantity,
            l.updatedAt = CURRENT_TIMESTAMP
        WHERE l.id = :lotId
          AND l.status = com.nchuy099.SmartPharma.inventory.domain.enums.InventoryLotStatus.ACTIVE
          AND l.expiryDate > CURRENT_DATE
          AND (l.quantityOnHand - l.quantityReserved) >= :quantity
    """)
    int reserveLot(UUID lotId, int quantity);

    @Modifying(flushAutomatically = true)
    @Query("""
        UPDATE InventoryLotEntity l
        SET l.quantityReserved = l.quantityReserved - :quantity,
            l.updatedAt = CURRENT_TIMESTAMP
        WHERE l.id = :lotId
          AND l.quantityReserved >= :quantity
    """)
    int releaseLot(UUID lotId, int quantity);

    @Modifying(flushAutomatically = true)
    @Query("""
        UPDATE InventoryLotEntity l
        SET l.quantityReserved = l.quantityReserved - :quantity,
            l.quantityOnHand = l.quantityOnHand - :quantity,
            l.status = CASE
                WHEN (l.quantityOnHand - :quantity) = 0 THEN com.nchuy099.SmartPharma.inventory.domain.enums.InventoryLotStatus.DEPLETED
                ELSE l.status
            END,
            l.updatedAt = CURRENT_TIMESTAMP
        WHERE l.id = :lotId
          AND l.quantityReserved >= :quantity
          AND l.quantityOnHand >= :quantity
    """)
    int exportReservedLot(UUID lotId, int quantity);

    @Query("""
        SELECT COALESCE(SUM(l.quantityOnHand), 0)
        FROM InventoryLotEntity l
        WHERE l.variant.id = :variantId
          AND l.status IN :statuses
    """)
    int sumOnHandByVariant(@Param("variantId") UUID variantId, @Param("statuses") List<InventoryLotStatus> statuses);

    @Query("""
        SELECT COALESCE(SUM(l.quantityReserved), 0)
        FROM InventoryLotEntity l
        WHERE l.variant.id = :variantId
          AND l.status IN :statuses
    """)
    int sumReservedByVariant(@Param("variantId") UUID variantId, @Param("statuses") List<InventoryLotStatus> statuses);
}
