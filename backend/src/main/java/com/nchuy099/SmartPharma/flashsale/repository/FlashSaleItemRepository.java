package com.nchuy099.SmartPharma.flashsale.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignStatus;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleItemStatus;
import com.nchuy099.SmartPharma.flashsale.entity.FlashSaleItemEntity;

public interface FlashSaleItemRepository extends JpaRepository<FlashSaleItemEntity, UUID> {

    @EntityGraph(attributePaths = {"campaign", "variant", "variant.product"})
    Optional<FlashSaleItemEntity> findById(UUID id);

    @EntityGraph(attributePaths = {"campaign", "variant", "variant.product"})
    List<FlashSaleItemEntity> findByCampaignId(UUID campaignId);

    @Query("""
            select i from FlashSaleItemEntity i
            join fetch i.campaign c
            join fetch i.variant v
            join fetch v.product p
            where v.id in :variantIds
              and c.status in :campaignStatuses
              and i.status = :itemStatus
            """)
    List<FlashSaleItemEntity> findActiveItemsByVariantIds(
            @Param("variantIds") Collection<UUID> variantIds,
            @Param("campaignStatuses") Collection<FlashSaleCampaignStatus> campaignStatuses,
            @Param("itemStatus") FlashSaleItemStatus itemStatus);
}
