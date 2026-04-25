package com.nchuy099.SmartPharma.flashsale.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignStatus;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignType;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleSlot;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "flash_sale_campaigns")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FlashSaleCampaignEntity extends AbstractEntity {

    @Column(nullable = false, unique = true)
    String code;

    @Column(nullable = false)
    String name;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(nullable = false)
    Instant startAt;

    @Column(nullable = false)
    Instant endAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "campaign_type", nullable = false)
    @Builder.Default
    FlashSaleCampaignType type = FlashSaleCampaignType.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "slot_code")
    FlashSaleSlot slot;

    @Column(name = "cover_image", columnDefinition = "TEXT")
    String coverImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    FlashSaleCampaignStatus status = FlashSaleCampaignStatus.DRAFT;

    @OneToMany(mappedBy = "campaign")
    @Builder.Default
    List<FlashSaleItemEntity> items = new ArrayList<>();
}
