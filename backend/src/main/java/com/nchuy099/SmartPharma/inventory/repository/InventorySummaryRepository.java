package com.nchuy099.SmartPharma.inventory.repository;

import com.nchuy099.SmartPharma.inventory.entity.InventorySummaryEntity;
import java.util.Collection;
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
public interface InventorySummaryRepository extends JpaRepository<InventorySummaryEntity, UUID> {

    @Query("""
      Select i from InventorySummaryEntity i
      join fetch i.variant v
      join fetch v.product p
      where v.id = :variantId
      """)
    Optional<InventorySummaryEntity> findByVariantId(@Param("variantId") UUID variantId);

    @Query("""
      Select i from InventorySummaryEntity i
      join fetch i.variant v
      join fetch v.product p
      where v.id in :variantIds
      """)
    List<InventorySummaryEntity> findAllByVariantIds(@Param("variantIds") Collection<UUID> variantIds);

    @Modifying(flushAutomatically = true)
    @Query(value = """
      INSERT INTO inventories (
          id,
          variant_id,
          quantity_on_hand,
          quantity_reserved,
          reorder_level,
          safety_stock,
          created_at,
          updated_at
      ) VALUES (
          gen_random_uuid(),
          :variantId,
          0,
          0,
          0,
          0,
          now(),
          now()
      )
      ON CONFLICT (variant_id) DO NOTHING
      """, nativeQuery = true)
    int insertDefaultSummary(@Param("variantId") UUID variantId);

    @Query("""
      SELECT i FROM InventorySummaryEntity i
      JOIN FETCH i.variant v
      JOIN FETCH v.product p
      WHERE p.id = :productId
      """)
    List<InventorySummaryEntity> findAllByProductId(@Param("productId") UUID productId);

    @Query(value = """
      SELECT i FROM InventorySummaryEntity i
      JOIN FETCH i.variant v
      JOIN FETCH v.product p
      WHERE (:search IS NULL OR :search = ''
             OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.webName) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.slug) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(v.sku) LIKE LOWER(CONCAT('%', :search, '%')))
      """, countQuery = """
      SELECT count(i) FROM InventorySummaryEntity i
      JOIN i.variant v
      JOIN v.product p
      WHERE (:search IS NULL OR :search = ''
             OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.webName) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.slug) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(v.sku) LIKE LOWER(CONCAT('%', :search, '%')))
      """)
    Page<InventorySummaryEntity> findAllWithVariant(@Param("search") String search, Pageable pageable);

    @Query("""
      SELECT i FROM InventorySummaryEntity i
      JOIN FETCH i.variant v
      JOIN FETCH v.product p
      WHERE (i.quantityOnHand - i.quantityReserved) <= :threshold
      ORDER BY (i.quantityOnHand - i.quantityReserved) ASC
      """)
    List<InventorySummaryEntity> findLowStockVariants(@Param("threshold") int threshold, Pageable pageable);

    @Query("SELECT count(i) FROM InventorySummaryEntity i WHERE (i.quantityOnHand - i.quantityReserved) <= :threshold")
    long countLowStockVariants(@Param("threshold") int threshold);
}
