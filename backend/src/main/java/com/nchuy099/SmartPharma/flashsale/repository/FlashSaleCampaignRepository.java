package com.nchuy099.SmartPharma.flashsale.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignStatus;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignType;
import com.nchuy099.SmartPharma.flashsale.entity.FlashSaleCampaignEntity;

public interface FlashSaleCampaignRepository extends JpaRepository<FlashSaleCampaignEntity, UUID> {
    Page<FlashSaleCampaignEntity> findAllByOrderByStartAtDesc(Pageable pageable);

    List<FlashSaleCampaignEntity> findByStatusIn(List<FlashSaleCampaignStatus> status);

    List<FlashSaleCampaignEntity> findByTypeAndStatusInOrderByStartAtAsc(FlashSaleCampaignType type, List<FlashSaleCampaignStatus> statuses);

    Optional<FlashSaleCampaignEntity> findByCode(String code);

    boolean existsByIdNotAndStartAtAndEndAtAndStatusIn(UUID campaignId, java.time.Instant startAt, java.time.Instant endAt, List<FlashSaleCampaignStatus> statuses);

    boolean existsByStartAtAndEndAtAndStatusIn(java.time.Instant startAt, java.time.Instant endAt, List<FlashSaleCampaignStatus> statuses);
}
