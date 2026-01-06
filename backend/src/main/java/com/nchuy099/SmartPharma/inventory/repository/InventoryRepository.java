package com.nchuy099.SmartPharma.inventory.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Collection;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.inventory.entity.InventoryEntity;

@Repository
public interface InventoryRepository extends JpaRepository<InventoryEntity, UUID> {

  @Query("""
      Select i from InventoryEntity i
      join fetch i.variant v
      join fetch v.product p
      where v.id = :variantId
      """)
  Optional<InventoryEntity> findByVariant_Id(@Param("variantId") UUID variantId);

  @Query("""
      Select i from InventoryEntity i
      join fetch i.variant v
      join fetch v.product p
      where v.id in :variantIds
      """)
  List<InventoryEntity> findAllByVariantIds(@Param("variantIds") Collection<UUID> variantIds);

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
  int insertDefaultInventory(@Param("variantId") UUID variantId);

  @Modifying(flushAutomatically = true)
  @Query("""
      UPDATE InventoryEntity i
      SET i.quantityOnHand = i.quantityOnHand + :quantity
          , i.updatedAt = CURRENT_TIMESTAMP
      WHERE i.id = :inventoryId
      """)
  int incrementQuantityOnHand(@Param("inventoryId") UUID inventoryId, @Param("quantity") int quantity);

  @Modifying(flushAutomatically = true)
  @Query("""
      UPDATE InventoryEntity i
      SET i.quantityReserved = i.quantityReserved + :quantity
          , i.updatedAt = CURRENT_TIMESTAMP
      WHERE i.id = :inventoryId
        AND (i.quantityOnHand - i.quantityReserved) >= :quantity
      """)
  int reserveQuantity(@Param("inventoryId") UUID inventoryId, @Param("quantity") int quantity);

  @Modifying(flushAutomatically = true)
  @Query("""
      UPDATE InventoryEntity i
      SET i.quantityReserved = i.quantityReserved - :quantity,
          i.quantityOnHand = i.quantityOnHand - :quantity,
          i.updatedAt = CURRENT_TIMESTAMP
      WHERE i.id = :inventoryId
        AND i.quantityReserved >= :quantity
        AND i.quantityOnHand >= :quantity
      """)
  int exportQuantity(@Param("inventoryId") UUID inventoryId, @Param("quantity") int quantity);

  @Modifying(flushAutomatically = true)
  @Query("""
      UPDATE InventoryEntity i
      SET i.quantityReserved = i.quantityReserved - :quantity
          , i.updatedAt = CURRENT_TIMESTAMP
      WHERE i.id = :inventoryId
        AND i.quantityReserved >= :quantity
      """)
  int releaseReservation(@Param("inventoryId") UUID inventoryId, @Param("quantity") int quantity);

  @Query("""
      SELECT i FROM InventoryEntity i
      JOIN FETCH i.variant v
      JOIN FETCH v.product p
      WHERE p.id = :productId
      """)
  List<InventoryEntity> findAllByProductId(@Param("productId") UUID productId);

  @Query(value = """
      SELECT i FROM InventoryEntity i 
      JOIN FETCH i.variant v
      JOIN FETCH v.product p 
      WHERE (:search IS NULL OR :search = '' 
             OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.webName) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.slug) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(v.sku) LIKE LOWER(CONCAT('%', :search, '%')))
      """, countQuery = """
      SELECT count(i) FROM InventoryEntity i 
      JOIN i.variant v 
      JOIN v.product p 
      WHERE (:search IS NULL OR :search = '' 
             OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.webName) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.slug) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(v.sku) LIKE LOWER(CONCAT('%', :search, '%')))
      """)
  Page<InventoryEntity> findAllWithVariant(@Param("search") String search, Pageable pageable);

  @Query("SELECT i FROM InventoryEntity i JOIN FETCH i.variant v JOIN FETCH v.product p WHERE (i.quantityOnHand - i.quantityReserved) <= :threshold ORDER BY (i.quantityOnHand - i.quantityReserved) ASC")
  List<InventoryEntity> findLowStockVariants(@Param("threshold") int threshold, Pageable pageable);

  @Query("SELECT count(i) FROM InventoryEntity i WHERE (i.quantityOnHand - i.quantityReserved) <= :threshold")
  long countLowStockVariants(@Param("threshold") int threshold);
}
