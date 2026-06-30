package com.nchuy099.SmartPharma.flashsale.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignStatus;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignType;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleSlot;
import com.nchuy099.SmartPharma.flashsale.dto.request.CreateFlashSaleCampaignRequest;
import com.nchuy099.SmartPharma.flashsale.dto.request.GenerateRandomFlashSaleCampaignRequest;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleCampaignResponse;
import com.nchuy099.SmartPharma.flashsale.entity.FlashSaleCampaignEntity;
import com.nchuy099.SmartPharma.flashsale.repository.FlashSaleCampaignRepository;
import com.nchuy099.SmartPharma.inventory.entity.InventorySummaryEntity;
import com.nchuy099.SmartPharma.inventory.repository.InventorySummaryRepository;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.product.repository.ProductVariantRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlashSaleAutoGenerationService {

    private static final DateTimeFormatter CAMPAIGN_CODE_DATE_FORMAT = DateTimeFormatter.BASIC_ISO_DATE;

    private final FlashSaleCampaignRepository campaignRepository;
    private final FlashSaleService flashSaleService;
    private final ProductVariantRepository productVariantRepository;
    private final InventorySummaryRepository inventoryRepository;

    @Value("${flash-sale.auto-generation.daily-item-count:10}")
    private int dailyItemCount;

    @Value("${flash-sale.auto-generation.discount-percent:20}")
    private BigDecimal discountPercent;

    @Value("${flash-sale.auto-generation.sale-stock-per-item:10}")
    private int saleStockPerItem;

    @Value("${flash-sale.auto-generation.per-user-limit:1}")
    private int perUserLimit;

    @Transactional
    public Optional<FlashSaleCampaignResponse> generateForDate(LocalDate date, ZoneId zoneId) {
        validateConfig();

        String campaignCode = campaignCodeFor(date);
        Optional<FlashSaleCampaignEntity> existing = campaignRepository.findByCode(campaignCode);
        if (existing.isPresent()) {
            log.info("Flash sale campaign {} already exists for {}", campaignCode, date);
            return Optional.of(flashSaleService.getCampaign(existing.get().getId()));
        }

        List<UUID> candidateVariantIds = productVariantRepository.findEligibleAutoFlashSaleVariantIds(
                        List.of(FlashSaleCampaignStatus.DRAFT, FlashSaleCampaignStatus.SCHEDULED, FlashSaleCampaignStatus.ACTIVE),
                        PageRequest.of(0, dailyItemCount))
                .getContent();

        if (candidateVariantIds.isEmpty()) {
            log.warn("No eligible variants found for auto flash sale on {}", date);
            return Optional.empty();
        }

        if (candidateVariantIds.size() < dailyItemCount) {
            log.warn("Only {} eligible variants found for auto flash sale on {} while target is {}", candidateVariantIds.size(), date, dailyItemCount);
        }

        Map<UUID, InventorySummaryEntity> inventoryByVariantId = inventoryRepository.findAllByVariantIds(candidateVariantIds)
                .stream()
                .collect(Collectors.toMap(inv -> inv.getVariant().getId(), inv -> inv));

        CreateFlashSaleCampaignRequest request = buildCampaignRequest(
                date,
                zoneId,
                candidateVariantIds,
                inventoryByVariantId,
                dailyItemCount,
                discountPercent,
                saleStockPerItem,
                perUserLimit,
                "Flash Sale " + date,
                "Auto-generated daily flash sale for " + date);
        FlashSaleCampaignResponse campaign = flashSaleService.createAndPublishCampaign(campaignCode, request);
        log.info("Created auto flash sale campaign {} with {} items for {}", campaignCode, campaign.getItems().size(), date);
        return Optional.of(campaign);
    }

    @Transactional
    public FlashSaleCampaignResponse generateRandomDraftCampaign(GenerateRandomFlashSaleCampaignRequest request) {
        validateConfig();
        validateRandomRequest(request);

        List<UUID> candidateVariantIds = productVariantRepository.findRandomEligibleAutoFlashSaleVariantIds(
                List.of(
                        FlashSaleCampaignStatus.DRAFT.name(),
                        FlashSaleCampaignStatus.SCHEDULED.name(),
                        FlashSaleCampaignStatus.ACTIVE.name()),
                request.getItemCount());

        if (candidateVariantIds.isEmpty()) {
            throw new AppException(ErrorCode.CONFLICT, "No eligible variants found for random flash sale draft");
        }

        Map<UUID, InventorySummaryEntity> inventoryByVariantId = inventoryRepository.findAllByVariantIds(candidateVariantIds)
                .stream()
                .collect(Collectors.toMap(inv -> inv.getVariant().getId(), inv -> inv));

        CreateFlashSaleCampaignRequest draftRequest = new CreateFlashSaleCampaignRequest();
        draftRequest.setName(StringUtils.hasText(request.getName()) ? request.getName().trim() : "Random Flash Sale Draft");
        draftRequest.setDescription(StringUtils.hasText(request.getDescription()) ? request.getDescription().trim() : "Randomly generated flash sale draft");
        draftRequest.setCampaignDate(randomDraftDate());
        draftRequest.setSlotCode(randomDraftSlot());
        draftRequest.setType(request.getType() != null ? request.getType() : FlashSaleCampaignType.NORMAL);
        draftRequest.setCoverImage(request.getCoverImage());
        draftRequest.setItems(buildCampaignItems(
                candidateVariantIds,
                inventoryByVariantId,
                request.getItemCount(),
                request.getDiscountPercent() != null ? request.getDiscountPercent() : discountPercent,
                request.getSaleStockPerItem() != null ? request.getSaleStockPerItem() : saleStockPerItem,
                request.getPerUserLimit() != null ? request.getPerUserLimit() : perUserLimit));
        return flashSaleService.createCampaign(draftRequest);
    }

    private CreateFlashSaleCampaignRequest buildCampaignRequest(
            LocalDate date,
            ZoneId zoneId,
            List<UUID> candidateVariantIds,
        Map<UUID, InventorySummaryEntity> inventoryByVariantId) {
        return buildCampaignRequest(
                date,
                zoneId,
                candidateVariantIds,
                inventoryByVariantId,
                dailyItemCount,
                discountPercent,
                saleStockPerItem,
                perUserLimit,
                "Flash Sale " + date,
                "Auto-generated daily flash sale for " + date);
    }

    private CreateFlashSaleCampaignRequest buildCampaignRequest(
            LocalDate date,
            ZoneId zoneId,
            List<UUID> candidateVariantIds,
            Map<UUID, InventorySummaryEntity> inventoryByVariantId,
            int itemCountLimit,
            BigDecimal discountPercent,
            int saleStockPerItem,
            int perUserLimit,
            String name,
            String description) {
        CreateFlashSaleCampaignRequest request = new CreateFlashSaleCampaignRequest();
        request.setName(name);
        request.setDescription(description);
        request.setCampaignDate(date);
        request.setSlotCode(FlashSaleSlot.MORNING_09_11);
        request.setType(FlashSaleCampaignType.NORMAL);
        request.setItems(buildCampaignItems(
                candidateVariantIds,
                inventoryByVariantId,
                itemCountLimit,
                discountPercent,
                saleStockPerItem,
                perUserLimit));
        return request;
    }

    private List<CreateFlashSaleCampaignRequest.ItemRequest> buildCampaignItems(
            List<UUID> candidateVariantIds,
            Map<UUID, InventorySummaryEntity> inventoryByVariantId,
            int itemCountLimit,
            BigDecimal discountPercent,
            int saleStockPerItem,
            int perUserLimit) {
        List<CreateFlashSaleCampaignRequest.ItemRequest> items = new ArrayList<>();
        for (UUID variantId : candidateVariantIds) {
            ProductVariantEntity variant = productVariantRepository.findByIdWithProduct(variantId)
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Variant not found for flash sale auto generation"));
            if (variant.getProduct() == null || !StringUtils.hasText(variant.getProduct().getPrimaryImage())) {
                continue;
            }

            InventorySummaryEntity inventory = inventoryByVariantId.get(variantId);
            if (inventory == null) {
                continue;
            }

            int available = Math.max(
                    0,
                    (inventory.getQuantityOnHand() != null ? inventory.getQuantityOnHand() : 0)
                            - (inventory.getQuantityReserved() != null ? inventory.getQuantityReserved() : 0));
            if (available <= 0) {
                continue;
            }

            int saleStock = Math.min(saleStockPerItem, available);
            BigDecimal flashPrice = variant.getSalePrice()
                    .multiply(BigDecimal.valueOf(100).subtract(discountPercent))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (flashPrice.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            CreateFlashSaleCampaignRequest.ItemRequest item = new CreateFlashSaleCampaignRequest.ItemRequest();
            item.setVariantId(variantId);
            item.setFlashPrice(flashPrice);
            item.setSaleStock(saleStock);
            item.setPerUserLimit(perUserLimit);
            items.add(item);
            if (items.size() >= itemCountLimit) {
                break;
            }
        }

        if (items.isEmpty()) {
            throw new AppException(ErrorCode.CONFLICT, "No eligible variants remained after flash sale item validation");
        }

        return items;
    }

    private void validateRandomRequest(GenerateRandomFlashSaleCampaignRequest request) {
        if (request == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Random flash sale request is required");
        }
        if (request.getType() == FlashSaleCampaignType.BIG_EVENT && !StringUtils.hasText(request.getCoverImage())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Random big event flash sale requires a cover image");
        }
        if (request.getItemCount() == null || request.getItemCount() <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Random flash sale item count must be greater than 0");
        }
        if (request.getSaleStockPerItem() == null || request.getSaleStockPerItem() <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Random flash sale stock per item must be greater than 0");
        }
        if (request.getPerUserLimit() == null || request.getPerUserLimit() <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Random flash sale per-user limit must be greater than 0");
        }
        if (request.getDiscountPercent() == null
                || request.getDiscountPercent().compareTo(BigDecimal.ZERO) <= 0
                || request.getDiscountPercent().compareTo(BigDecimal.valueOf(100)) >= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Random flash sale discount percent must be between 0 and 100");
        }
    }

    private LocalDate randomDraftDate() {
        return LocalDate.now().plusDays(ThreadLocalRandom.current().nextLong(0, 3));
    }

    private FlashSaleSlot randomDraftSlot() {
        FlashSaleSlot[] slots = FlashSaleSlot.values();
        return slots[ThreadLocalRandom.current().nextInt(slots.length)];
    }

    private void validateConfig() {
        if (dailyItemCount <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Daily flash sale item count must be greater than 0");
        }
        if (saleStockPerItem <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Daily flash sale stock per item must be greater than 0");
        }
        if (perUserLimit <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Daily flash sale per-user limit must be greater than 0");
        }
        if (discountPercent == null || discountPercent.compareTo(BigDecimal.ZERO) <= 0 || discountPercent.compareTo(BigDecimal.valueOf(100)) >= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Daily flash sale discount percent must be between 0 and 100");
        }
    }

    private String campaignCodeFor(LocalDate date) {
        return "AUTO-FS-" + date.format(CAMPAIGN_CODE_DATE_FORMAT);
    }
}
