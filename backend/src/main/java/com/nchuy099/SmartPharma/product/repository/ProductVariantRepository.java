package com.nchuy099.SmartPharma.product.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignStatus;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariantEntity, UUID> {

    List<ProductVariantEntity> findByProductId(UUID productId);

    Optional<ProductVariantEntity> findBySku(String sku);


    List<ProductVariantEntity> findByProductIdAndIsActiveTrue(UUID productId);

    @Query("SELECT v FROM ProductVariantEntity v JOIN FETCH v.product p WHERE v.id = :id")
    Optional<ProductVariantEntity> findByIdWithProduct(@Param("id") UUID id);

    @Query(value = """
            SELECT v.id
            FROM ProductVariantEntity v
            JOIN v.product p
            JOIN v.inventory i
            WHERE v.isActive = true
              AND p.isActive = true
              AND v.salePrice IS NOT NULL
              AND v.salePrice > 0
              AND EXISTS (
                  SELECT 1
                  FROM p.images img
                  WHERE img.isPrimary = true
              )
              AND (i.quantityOnHand - i.quantityReserved) > 0
              AND NOT EXISTS (
                  SELECT 1
                  FROM FlashSaleItemEntity item
                  JOIN item.campaign c
                  WHERE item.variant = v
                    AND c.status IN :excludedCampaignStatuses
              )
            ORDER BY p.updatedAt DESC, v.updatedAt DESC, v.id DESC
            """,
            countQuery = """
            SELECT COUNT(v)
            FROM ProductVariantEntity v
            JOIN v.product p
            JOIN v.inventory i
            WHERE v.isActive = true
              AND p.isActive = true
              AND v.salePrice IS NOT NULL
              AND v.salePrice > 0
              AND EXISTS (
                  SELECT 1
                  FROM p.images img
                  WHERE img.isPrimary = true
              )
              AND (i.quantityOnHand - i.quantityReserved) > 0
              AND NOT EXISTS (
                  SELECT 1
                  FROM FlashSaleItemEntity item
                  JOIN item.campaign c
                  WHERE item.variant = v
                    AND c.status IN :excludedCampaignStatuses
              )
            """)
    Page<UUID> findEligibleAutoFlashSaleVariantIds(
            @Param("excludedCampaignStatuses") Collection<FlashSaleCampaignStatus> excludedCampaignStatuses,
            Pageable pageable);

    @Query(value = """
            SELECT v.id
            FROM product_variants v
            JOIN products p ON p.id = v.product_id
            JOIN inventories i ON i.variant_id = v.id
            WHERE v.is_active = true
              AND p.is_active = true
              AND v.sale_price IS NOT NULL
              AND v.sale_price > 0
              AND EXISTS (
                  SELECT 1
                  FROM product_images img
                  WHERE img.product_id = p.id
                    AND img.is_primary = true
              )
              AND (i.quantity_on_hand - i.quantity_reserved) > 0
              AND NOT EXISTS (
                  SELECT 1
                  FROM flash_sale_items item
                  JOIN flash_sale_campaigns c ON c.id = item.campaign_id
                  WHERE item.variant_id = v.id
                    AND c.status IN (:excludedCampaignStatuses)
              )
            ORDER BY random()
            LIMIT :limit
            """, nativeQuery = true)
    List<UUID> findRandomEligibleAutoFlashSaleVariantIds(
            @Param("excludedCampaignStatuses") Collection<String> excludedCampaignStatuses,
            @Param("limit") int limit);
}
