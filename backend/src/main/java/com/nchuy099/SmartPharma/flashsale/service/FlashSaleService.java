package com.nchuy099.SmartPharma.flashsale.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.util.StringUtils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignStatus;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignType;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleItemStatus;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleReservationStatus;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleSchedule;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleSlot;
import com.nchuy099.SmartPharma.flashsale.dto.request.ClaimFlashSaleRequest;
import com.nchuy099.SmartPharma.flashsale.dto.request.CreateFlashSaleCampaignRequest;
import com.nchuy099.SmartPharma.flashsale.dto.request.UpdateFlashSaleCampaignRequest;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleCampaignResponse;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleClaimResponse;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleItemResponse;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleReservationView;
import com.nchuy099.SmartPharma.flashsale.entity.FlashSaleCampaignEntity;
import com.nchuy099.SmartPharma.flashsale.entity.FlashSaleItemEntity;
import com.nchuy099.SmartPharma.flashsale.entity.FlashSaleReservationEntity;
import com.nchuy099.SmartPharma.flashsale.repository.FlashSaleCampaignRepository;
import com.nchuy099.SmartPharma.flashsale.repository.FlashSaleItemRepository;
import com.nchuy099.SmartPharma.flashsale.repository.FlashSaleReservationRepository;
import com.nchuy099.SmartPharma.inventory.entity.InventorySummaryEntity;
import com.nchuy099.SmartPharma.inventory.repository.InventorySummaryRepository;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.product.repository.ProductVariantRepository;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.UserRepository;
import com.nchuy099.SmartPharma.flashsale.config.FlashSaleWebSocketBroadcaster;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class FlashSaleService {

    private static final String STOCK_KEY_PREFIX = "flash:sale:item:";
    private static final String USER_KEY_SUFFIX = ":users";
    private static final String RESERVATION_KEY_SUFFIX = ":reservation:";
    private static final String TOPIC_PREFIX = "/topic/flash-sales/items/";
    private static final String CACHE_KEY_PREFIX = "flash:sale:cache:";
    private static final String CUSTOMER_CAMPAIGN_LIST_CACHE_KEY = CACHE_KEY_PREFIX + "campaigns:customer";
    private static final String BIG_EVENT_LIST_CACHE_KEY = CACHE_KEY_PREFIX + "campaigns:events";
    private static final String BIG_EVENT_DETAIL_CACHE_KEY_PREFIX = CACHE_KEY_PREFIX + "campaigns:event:";
    private static final String ACTIVE_ITEM_LIST_CACHE_KEY = CACHE_KEY_PREFIX + "items:active";
    private static final String ITEM_DETAIL_CACHE_KEY_PREFIX = CACHE_KEY_PREFIX + "items:detail:";
    private static final String ACTIVE_ITEM_VARIANT_CACHE_KEY_PREFIX = CACHE_KEY_PREFIX + "items:variants:";
    private static final TypeReference<List<CachedFlashSaleCampaign>> CACHED_CAMPAIGN_LIST_TYPE = new TypeReference<>() {};
    private static final TypeReference<CachedFlashSaleCampaign> CACHED_CAMPAIGN_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<CachedFlashSaleItem>> CACHED_ITEM_LIST_TYPE = new TypeReference<>() {};
    private static final TypeReference<CachedFlashSaleItem> CACHED_ITEM_TYPE = new TypeReference<>() {};

    private final FlashSaleCampaignRepository campaignRepository;
    private final FlashSaleItemRepository itemRepository;
    private final FlashSaleReservationRepository reservationRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventorySummaryRepository inventoryRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final StringRedisTemplate stringRedisTemplate;
    private final FlashSaleWebSocketBroadcaster webSocketBroadcaster;
    private final FlashSaleSlotResolver flashSaleSlotResolver;
    private final ObjectMapper objectMapper;

    @Value("${flash-sale.reservation-ttl-seconds:300}")
    private int reservationTtlSeconds;

    @Value("${flash-sale.cache.campaign-ttl-seconds:30}")
    private long campaignCacheTtlSeconds;

    @Value("${flash-sale.cache.item-ttl-seconds:15}")
    private long itemCacheTtlSeconds;

    @PostConstruct
    void init() {
        log.info("Flash sale service initialized");
    }

    public Page<FlashSaleCampaignResponse> listCampaigns(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), size);
        return campaignRepository.findAllByOrderByStartAtDesc(pageable).map(this::toCampaignResponse);
    }

    public FlashSaleCampaignResponse getCampaign(UUID campaignId) {
        FlashSaleCampaignEntity campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Flash sale campaign not found"));
        return toCampaignResponse(campaign);
    }

    public FlashSaleCampaignResponse getCampaignByCode(String campaignCode) {
        FlashSaleCampaignEntity campaign = campaignRepository.findByCode(campaignCode)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Flash sale campaign not found"));
        return toCampaignResponse(campaign);
    }

    public FlashSaleCampaignResponse getBigEventCampaignByCode(String campaignCode) {
        String cacheKey = bigEventDetailCacheKey(campaignCode);
        Optional<CachedFlashSaleCampaign> cachedCampaign = readCache(cacheKey, CACHED_CAMPAIGN_TYPE);
        if (cachedCampaign.isPresent()) {
            CachedFlashSaleCampaign snapshot = cachedCampaign.get();
            if (snapshot.type() == FlashSaleCampaignType.BIG_EVENT && isCustomerVisibleCampaign(snapshot.endAt())) {
                return toCampaignResponse(snapshot);
            }
            deleteCacheKey(cacheKey);
        }

        FlashSaleCampaignEntity campaign = campaignRepository.findByCode(campaignCode)
                .filter(existing -> existing.getType() == FlashSaleCampaignType.BIG_EVENT)
                .filter(this::isCustomerVisibleCampaign)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Flash sale campaign not found"));
        CachedFlashSaleCampaign snapshot = toCachedCampaign(campaign);
        writeCache(cacheKey, snapshot, campaignCacheTtlSeconds);
        return toCampaignResponse(snapshot);
    }

    public List<FlashSaleCampaignResponse> getBigEventCampaigns() {
        List<CachedFlashSaleCampaign> snapshots = readCache(BIG_EVENT_LIST_CACHE_KEY, CACHED_CAMPAIGN_LIST_TYPE)
                .orElseGet(() -> {
                    List<CachedFlashSaleCampaign> loaded = loadBigEventCampaignSnapshots();
                    writeCache(BIG_EVENT_LIST_CACHE_KEY, loaded, campaignCacheTtlSeconds);
                    return loaded;
                });
        return snapshots.stream()
                .filter(snapshot -> isCustomerVisibleCampaign(snapshot.endAt()))
                .map(this::toCampaignResponse)
                .toList();
    }

    public List<FlashSaleCampaignResponse> getCustomerCampaigns() {
        List<CachedFlashSaleCampaign> snapshots = readCache(CUSTOMER_CAMPAIGN_LIST_CACHE_KEY, CACHED_CAMPAIGN_LIST_TYPE)
                .orElseGet(() -> {
                    List<CachedFlashSaleCampaign> loaded = loadCustomerCampaignSnapshots();
                    writeCache(CUSTOMER_CAMPAIGN_LIST_CACHE_KEY, loaded, campaignCacheTtlSeconds);
                    return loaded;
                });
        return snapshots.stream()
                .filter(snapshot -> isCustomerVisibleCampaign(snapshot.endAt()))
                .map(this::toCampaignResponse)
                .toList();
    }

    @Transactional
    public FlashSaleCampaignResponse createCampaign(CreateFlashSaleCampaignRequest request) {
        return createCampaign(generateCampaignCode(), request);
    }

    @Transactional
    public FlashSaleCampaignResponse createCampaign(String code, CreateFlashSaleCampaignRequest request) {
        return createCampaignInternal(code, request, false);
    }

    @Transactional
    public FlashSaleCampaignResponse createAndPublishCampaign(String code, CreateFlashSaleCampaignRequest request) {
        return createCampaignInternal(code, request, true);
    }

    private FlashSaleCampaignResponse createCampaignInternal(String code, CreateFlashSaleCampaignRequest request, boolean publishImmediately) {
        FlashSaleSchedule schedule = resolveSchedule(request.getCampaignDate(), request.getSlotCode());
        validateCampaignWindow(schedule.startAt(), schedule.endAt());
        validateCampaignMetadata(request.getType(), request.getCoverImage());
        ensureCampaignSlotAvailable(null, schedule.startAt(), schedule.endAt());
        ensureUniqueVariantIds(request.getItems());

        FlashSaleCampaignEntity campaign = FlashSaleCampaignEntity.builder()
                .code(code)
                .name(request.getName().trim())
                .description(StringUtils.hasText(request.getDescription()) ? request.getDescription().trim() : null)
                .type(request.getType())
                .coverImage(StringUtils.hasText(request.getCoverImage()) ? request.getCoverImage().trim() : null)
                .slot(request.getSlotCode())
                .startAt(schedule.startAt())
                .endAt(schedule.endAt())
                .status(FlashSaleCampaignStatus.DRAFT)
                .build();
        campaign = campaignRepository.save(campaign);

        persistCampaignItems(campaign, request.getItems());

        if (publishImmediately) {
            publishCampaign(campaign.getId());
        }

        return getCampaign(campaign.getId());
    }

    @Transactional
    public FlashSaleCampaignResponse updateCampaign(UUID campaignId, UpdateFlashSaleCampaignRequest request) {
        FlashSaleCampaignEntity campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Flash sale campaign not found"));
        ensureDraftEditable(campaign);
        if (StringUtils.hasText(request.getName())) {
            campaign.setName(request.getName().trim());
        }
        if (StringUtils.hasText(request.getDescription())) {
            campaign.setDescription(request.getDescription().trim());
        }
        if (request.getType() != null) {
            campaign.setType(request.getType());
        }
        if (request.getCoverImage() != null) {
            campaign.setCoverImage(StringUtils.hasText(request.getCoverImage()) ? request.getCoverImage().trim() : null);
        }
        LocalDate campaignDate = request.getCampaignDate() != null ? request.getCampaignDate() : flashSaleSlotResolver.resolveCampaignDate(campaign.getStartAt());
        FlashSaleSlot slotCode = request.getSlotCode() != null ? request.getSlotCode() : campaign.getSlot();
        if (request.getCampaignDate() != null || request.getSlotCode() != null) {
            FlashSaleSchedule schedule = resolveSchedule(campaignDate, slotCode);
            validateCampaignWindow(schedule.startAt(), schedule.endAt());
            ensureCampaignSlotAvailable(campaign.getId(), schedule.startAt(), schedule.endAt());
            campaign.setStartAt(schedule.startAt());
            campaign.setEndAt(schedule.endAt());
            campaign.setSlot(slotCode);
        }
        validateCampaignMetadata(campaign.getType(), campaign.getCoverImage());
        campaignRepository.save(campaign);
        return getCampaign(campaignId);
    }

    @Transactional
    public FlashSaleCampaignResponse addCampaignItem(UUID campaignId, CreateFlashSaleCampaignRequest.ItemRequest request) {
        FlashSaleCampaignEntity campaign = getEditableCampaign(campaignId);
        boolean duplicateVariant = itemRepository.findByCampaignId(campaignId).stream()
                .anyMatch(item -> item.getVariant().getId().equals(request.getVariantId()));
        if (duplicateVariant) {
            throw new AppException(ErrorCode.CONFLICT, "Duplicate variant in flash sale request");
        }
        persistCampaignItems(campaign, List.of(request));
        return getCampaign(campaignId);
    }

    @Transactional
    public FlashSaleCampaignResponse updateCampaignItem(UUID campaignId, UUID itemId, CreateFlashSaleCampaignRequest.ItemRequest request) {
        FlashSaleCampaignEntity campaign = getEditableCampaign(campaignId);
        FlashSaleItemEntity item = itemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Flash sale item not found"));
        if (!item.getCampaign().getId().equals(campaign.getId())) {
            throw new AppException(ErrorCode.CONFLICT, "Flash sale item does not belong to this campaign");
        }
        boolean duplicateVariant = itemRepository.findByCampaignId(campaignId).stream()
                .filter(existing -> !existing.getId().equals(itemId))
                .anyMatch(existing -> existing.getVariant().getId().equals(request.getVariantId()));
        if (duplicateVariant) {
            throw new AppException(ErrorCode.CONFLICT, "Duplicate variant in flash sale request");
        }
        FlashSaleItemValidation validation = validateFlashSaleItem(request);
        item.setVariant(validation.variant());
        item.setOriginalPrice(validation.variant().getSalePrice());
        item.setFlashPrice(request.getFlashPrice());
        item.setSaleStock(request.getSaleStock());
        item.setPerUserLimit(request.getPerUserLimit() != null ? request.getPerUserLimit() : 1);
        itemRepository.save(item);
        return getCampaign(campaignId);
    }

    @Transactional
    public FlashSaleCampaignResponse removeCampaignItem(UUID campaignId, UUID itemId) {
        FlashSaleCampaignEntity campaign = getEditableCampaign(campaignId);
        FlashSaleItemEntity item = itemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Flash sale item not found"));
        if (!item.getCampaign().getId().equals(campaign.getId())) {
            throw new AppException(ErrorCode.CONFLICT, "Flash sale item does not belong to this campaign");
        }
        itemRepository.delete(item);
        return getCampaign(campaignId);
    }

    @Transactional
    public FlashSaleCampaignResponse publishCampaign(UUID campaignId) {
        FlashSaleCampaignEntity campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Flash sale campaign not found"));

        if (campaign.getStatus() == FlashSaleCampaignStatus.CANCELLED) {
            throw new AppException(ErrorCode.CONFLICT, "Campaign has been cancelled");
        }
        if (campaign.getStatus() != FlashSaleCampaignStatus.DRAFT) {
            throw new AppException(ErrorCode.CONFLICT, "Only draft campaigns can be published");
        }

        List<FlashSaleItemEntity> items = itemRepository.findByCampaignId(campaignId);
        if (items.isEmpty()) {
            throw new AppException(ErrorCode.CONFLICT, "Flash sale campaign has no items");
        }

        for (FlashSaleItemEntity item : items) {
            validateFlashSaleItem(item.getVariant().getId(), item.getSaleStock(), item.getFlashPrice(), item.getPerUserLimit());
            item.setStatus(FlashSaleItemStatus.ACTIVE);
            itemRepository.save(item);
            preloadRedis(item);
        }

        campaign.setStatus(Instant.now().isBefore(campaign.getStartAt())
                ? FlashSaleCampaignStatus.SCHEDULED
                : FlashSaleCampaignStatus.ACTIVE);
        campaignRepository.save(campaign);
        invalidateCustomerReadCaches();
        return getCampaign(campaignId);
    }

    @Transactional
    public FlashSaleCampaignResponse cancelCampaign(UUID campaignId) {
        FlashSaleCampaignEntity campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Flash sale campaign not found"));
        if (campaign.getStatus() == FlashSaleCampaignStatus.CANCELLED) {
            return getCampaign(campaignId);
        }
        campaign.setStatus(FlashSaleCampaignStatus.CANCELLED);
        List<FlashSaleItemEntity> items = itemRepository.findByCampaignId(campaignId);
        for (FlashSaleItemEntity item : items) {
            item.setStatus(FlashSaleItemStatus.ENDED);
            restoreRedisItemStock(item);
        }
        campaignRepository.save(campaign);
        items.forEach(itemRepository::save);
        invalidateCustomerReadCaches();
        return getCampaign(campaignId);
    }

    public List<FlashSaleItemResponse> getActiveItems() {
        List<CachedFlashSaleItem> snapshots = readCache(ACTIVE_ITEM_LIST_CACHE_KEY, CACHED_ITEM_LIST_TYPE)
                .orElseGet(() -> {
                    List<CachedFlashSaleItem> loaded = loadActiveItemSnapshots();
                    writeCache(ACTIVE_ITEM_LIST_CACHE_KEY, loaded, itemCacheTtlSeconds);
                    return loaded;
                });
        return snapshots.stream()
                .filter(this::isLiveFlashSaleItem)
                .map(this::toItemResponse)
                .toList();
    }

    public List<FlashSaleItemResponse> getActiveItemsByVariantIds(Collection<UUID> variantIds) {
        if (variantIds == null || variantIds.isEmpty()) {
            return List.of();
        }
        String cacheKey = activeItemsByVariantCacheKey(variantIds);
        List<CachedFlashSaleItem> snapshots = readCache(cacheKey, CACHED_ITEM_LIST_TYPE)
                .orElseGet(() -> {
                    List<CachedFlashSaleItem> loaded = loadActiveItemSnapshotsByVariantIds(variantIds);
                    writeCache(cacheKey, loaded, itemCacheTtlSeconds);
                    return loaded;
                });
        return snapshots.stream()
                .filter(this::isLiveFlashSaleItem)
                .map(this::toItemResponse)
                .toList();
    }

    public FlashSaleItemResponse getItem(UUID itemId) {
        String cacheKey = itemDetailCacheKey(itemId);
        Optional<CachedFlashSaleItem> cachedItem = readCache(cacheKey, CACHED_ITEM_TYPE);
        if (cachedItem.isPresent()) {
            return toItemResponse(cachedItem.get());
        }
        FlashSaleItemEntity item = itemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Flash sale item not found"));
        CachedFlashSaleItem snapshot = toCachedItem(item);
        writeCache(cacheKey, snapshot, itemCacheTtlSeconds);
        return toItemResponse(snapshot);
    }

    public FlashSaleClaimResponse claim(UUID itemId, ClaimFlashSaleRequest request) {
        UUID userId = securityUtils.getCurrentUserId();
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));
        FlashSaleItemEntity item = itemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Flash sale item not found"));
        validateItemCanBeClaimed(item);

        UUID reservationId = deterministicReservationId(userId, itemId, request.getIdempotencyKey());
        String result = executeClaimScript(item, userId, request.getQuantity(), reservationId, request.getIdempotencyKey());
        ClaimResult claimResult = parseClaimResult(result);

        if (!"OK".equals(claimResult.status) && !"EXISTING".equals(claimResult.status)) {
            if ("REDIS_FAILURE".equals(claimResult.message)) {
                throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Flash sale service is temporarily unavailable");
            }
            throw new AppException(ErrorCode.CONFLICT, resolveClaimErrorMessage(claimResult.message));
        }

        Instant expiresAt = Instant.now().plusSeconds(reservationTtlSeconds);
        try {
            FlashSaleReservationEntity reservation = reservationRepository.findByReservationToken(reservationId)
                    .orElseGet(() -> FlashSaleReservationEntity.builder()
                            .reservationToken(reservationId)
                            .item(item)
                            .user(user)
                            .quantity(request.getQuantity())
                            .idempotencyKey(request.getIdempotencyKey())
                            .status(FlashSaleReservationStatus.HELD)
                            .expiresAt(expiresAt)
                            .build());

            reservation.setItem(item);
            reservation.setUser(user);
            reservation.setQuantity(request.getQuantity());
            reservation.setIdempotencyKey(request.getIdempotencyKey());
            reservation.setStatus(FlashSaleReservationStatus.HELD);
            reservation.setExpiresAt(expiresAt);
            reservationRepository.save(reservation);

            webSocketBroadcaster.broadcast(TOPIC_PREFIX + itemId, Map.of(
                    "itemId", itemId.toString(),
                    "remainingStock", claimResult.remainingStock,
                    "status", "HELD",
                    "serverTime", Instant.now().toString()));
        } catch (RuntimeException ex) {
            restoreClaimedStock(item, request.getQuantity(), reservationId, userId, request.getIdempotencyKey());
            throw ex;
        }

        return FlashSaleClaimResponse.builder()
                .reservationId(reservationId)
                .quantity(request.getQuantity())
                .remainingStock(claimResult.remainingStock)
                .expiresAt(expiresAt)
                .item(toItemResponse(item))
                .build();
    }

    @Transactional(readOnly = true)
    public FlashSaleReservationView getReservationView(UUID reservationId, UUID userId) {
        FlashSaleReservationEntity reservation = reservationRepository.findByReservationTokenAndUserId(reservationId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Flash sale reservation not found"));
        return FlashSaleReservationView.builder()
                .reservationId(reservation.getReservationToken())
                .itemId(reservation.getItem().getId())
                .userId(reservation.getUser().getId())
                .variantId(reservation.getItem().getVariant().getId())
                .quantity(reservation.getQuantity())
                .flashPrice(reservation.getItem().getFlashPrice())
                .perUserLimit(reservation.getItem().getPerUserLimit())
                .expiresAt(reservation.getExpiresAt())
                .status(reservation.getStatus().name())
                .build();
    }

    public FlashSaleReservationView getReservationFromToken(UUID reservationId, UUID userId) {
        return getReservationView(reservationId, userId);
    }

    public FlashSaleReservationView resolveReservationForCheckout(UUID reservationId, UUID userId) {
        return getReservationView(reservationId, userId);
    }

    @Transactional
    public void confirmReservation(UUID reservationId, UUID userId, UUID orderId) {
        FlashSaleReservationEntity reservation = reservationRepository.findByReservationTokenAndUserId(reservationId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Flash sale reservation not found"));
        reservation.setStatus(FlashSaleReservationStatus.CONFIRMED);
        OrderEntity orderRef = orderRepository.getReferenceById(orderId);
        reservation.setOrder(orderRef);
        reservationRepository.save(reservation);
    }

    @Transactional
    public void releaseReservation(UUID reservationId, UUID userId) {
        FlashSaleReservationEntity reservation = reservationRepository.findByReservationTokenAndUserId(reservationId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Flash sale reservation not found"));
        if (reservation.getStatus() == FlashSaleReservationStatus.EXPIRED
                || reservation.getStatus() == FlashSaleReservationStatus.CANCELLED) {
            return;
        }
        reservation.setStatus(FlashSaleReservationStatus.CANCELLED);
        reservationRepository.save(reservation);
        restoreClaimedStock(reservation.getItem(), reservation.getQuantity(), reservation.getReservationToken(), userId, reservation.getIdempotencyKey());
        webSocketBroadcaster.broadcast(TOPIC_PREFIX + reservation.getItem().getId(), Map.of(
                "itemId", reservation.getItem().getId().toString(),
                "remainingStock", getRemainingStock(reservation.getItem()),
                "status", "RELEASED",
                "serverTime", Instant.now().toString()));
    }

    @Transactional
    @Scheduled(fixedDelayString = "${flash-sale.expiry-scan-ms:60000}")
    public void expireReservations() {
        List<FlashSaleReservationEntity> expired = reservationRepository.findExpiredReservations(
                FlashSaleReservationStatus.HELD,
                Instant.now());
        for (FlashSaleReservationEntity reservation : expired) {
            reservation.setStatus(FlashSaleReservationStatus.EXPIRED);
            reservationRepository.save(reservation);
            restoreClaimedStock(reservation.getItem(), reservation.getQuantity(), reservation.getReservationToken(), reservation.getUser().getId(), reservation.getIdempotencyKey());
        }
    }

    public Integer getRemainingStock(FlashSaleItemEntity item) {
        return getRemainingStock(item.getId(), item.getSaleStock());
    }

    private Integer getRemainingStock(UUID itemId, Integer saleStock) {
        try {
            String stock = stringRedisTemplate.opsForValue().get(stockKey(itemId));
            if (stock != null) {
                try {
                    return Integer.parseInt(stock);
                } catch (NumberFormatException ignored) {
                    log.debug("Invalid Redis stock value for flash sale item {}", itemId);
                }
            }
        } catch (RedisConnectionFailureException e) {
            log.warn("Redis unavailable while reading flash sale stock for item {}. Falling back to DB.", itemId);
        } catch (RuntimeException e) {
            log.warn("Failed to read flash sale stock from Redis for item {}. Falling back to DB.", itemId, e);
        }
        return getRemainingStockFromDatabase(itemId, saleStock);
    }

    private Integer getRemainingStockFromDatabase(UUID itemId, Integer saleStock) {
        Long reserved = reservationRepository.sumQuantityByItemIdAndStatusIn(
                itemId,
                List.of(FlashSaleReservationStatus.HELD, FlashSaleReservationStatus.CONFIRMED));
        int remaining = (saleStock != null ? saleStock : 0) - (reserved != null ? reserved.intValue() : 0);
        return Math.max(remaining, 0);
    }

    private void validateCampaignWindow(Instant startAt, Instant endAt) {
        if (startAt == null || endAt == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Campaign start and end time are required");
        }
        if (!endAt.isAfter(startAt)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Campaign end time must be after start time");
        }
    }

    private void validateCampaignMetadata(FlashSaleCampaignType type, String coverImage) {
        if (type == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Campaign type is required");
        }
        if (type == FlashSaleCampaignType.BIG_EVENT && !StringUtils.hasText(coverImage)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Big event flash sale must have a cover image");
        }
    }

    private FlashSaleSchedule resolveSchedule(LocalDate campaignDate, FlashSaleSlot slotCode) {
        return flashSaleSlotResolver.resolve(campaignDate, slotCode);
    }

    private void ensureCampaignSlotAvailable(UUID campaignId, Instant startAt, Instant endAt) {
        List<FlashSaleCampaignStatus> statuses = List.of(FlashSaleCampaignStatus.DRAFT, FlashSaleCampaignStatus.SCHEDULED, FlashSaleCampaignStatus.ACTIVE);
        boolean exists = campaignId == null
                ? campaignRepository.existsByStartAtAndEndAtAndStatusIn(startAt, endAt, statuses)
                : campaignRepository.existsByIdNotAndStartAtAndEndAtAndStatusIn(campaignId, startAt, endAt, statuses);
        if (exists) {
            throw new AppException(ErrorCode.CONFLICT, "A flash sale campaign already exists for this slot");
        }
    }

    private void ensureDraftEditable(FlashSaleCampaignEntity campaign) {
        if (campaign.getStatus() != FlashSaleCampaignStatus.DRAFT) {
            throw new AppException(ErrorCode.CONFLICT, "Published flash sale campaigns cannot be edited");
        }
    }

    private FlashSaleCampaignEntity getEditableCampaign(UUID campaignId) {
        FlashSaleCampaignEntity campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Flash sale campaign not found"));
        ensureDraftEditable(campaign);
        return campaign;
    }

    private void ensureUniqueVariantIds(List<CreateFlashSaleCampaignRequest.ItemRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Flash sale must contain at least one item");
        }
        java.util.Set<UUID> seen = new java.util.HashSet<>();
        for (CreateFlashSaleCampaignRequest.ItemRequest item : items) {
            if (item != null && item.getVariantId() != null && !seen.add(item.getVariantId())) {
                throw new AppException(ErrorCode.CONFLICT, "Duplicate variant in flash sale request");
            }
        }
    }

    private FlashSaleItemValidation validateFlashSaleItem(CreateFlashSaleCampaignRequest.ItemRequest itemRequest) {
        if (itemRequest == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Flash sale item is required");
        }
        return validateFlashSaleItem(
                itemRequest.getVariantId(),
                itemRequest.getSaleStock(),
                itemRequest.getFlashPrice(),
                itemRequest.getPerUserLimit());
    }

    private FlashSaleItemValidation validateFlashSaleItem(UUID variantId, Integer saleStock, java.math.BigDecimal flashPrice, Integer perUserLimit) {
        if (variantId == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Variant is required");
        }
        ProductVariantEntity variant = productVariantRepository.findByIdWithProduct(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.VARIANT_NOT_FOUND, "Variant not found"));
        if (!Boolean.TRUE.equals(variant.getIsActive())) {
            throw new AppException(ErrorCode.CONFLICT, "Variant is inactive");
        }
        if (variant.getProduct() == null || !Boolean.TRUE.equals(variant.getProduct().getIsActive())) {
            throw new AppException(ErrorCode.CONFLICT, "Product is inactive");
        }

        InventorySummaryEntity inventory = inventoryRepository.findByVariantId(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Inventory summary not found"));
        int availableStock = inventory.getQuantityAvailable() != null ? inventory.getQuantityAvailable() : 0;
        if (availableStock <= 0) {
            throw new AppException(ErrorCode.CONFLICT, "Variant is out of stock");
        }
        if (saleStock == null || saleStock <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Sale stock must be greater than 0");
        }
        if (saleStock > availableStock) {
            throw new AppException(ErrorCode.CONFLICT, "Flash sale stock exceeds available inventory");
        }
        if (flashPrice == null || flashPrice.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Flash price must be greater than 0");
        }
        if (variant.getSalePrice() != null && flashPrice.compareTo(variant.getSalePrice()) >= 0) {
            throw new AppException(ErrorCode.CONFLICT, "Flash price must be lower than the variant sale price");
        }
        if (perUserLimit != null && perUserLimit > saleStock) {
            throw new AppException(ErrorCode.CONFLICT, "Per user limit cannot exceed sale stock");
        }
        return new FlashSaleItemValidation(variant, inventory);
    }

    private int campaignTypePriority(FlashSaleCampaignType type) {
        return type == FlashSaleCampaignType.BIG_EVENT ? 0 : 1;
    }

    private boolean isCustomerVisibleCampaign(FlashSaleCampaignEntity campaign) {
        return campaign.getEndAt() != null && campaign.getEndAt().isAfter(Instant.now());
    }

    private boolean isCustomerVisibleCampaign(Instant endAt) {
        return endAt != null && endAt.isAfter(Instant.now());
    }

    private boolean isLiveFlashSaleItem(CachedFlashSaleItem item) {
        return isLiveFlashSaleWindow(item.startAt(), item.endAt());
    }

    private boolean isLiveFlashSaleItem(FlashSaleItemEntity item) {
        return item != null
                && item.getCampaign() != null
                && isLiveFlashSaleWindow(item.getCampaign().getStartAt(), item.getCampaign().getEndAt());
    }

    private boolean isLiveFlashSaleWindow(Instant startAt, Instant endAt) {
        if (startAt == null || endAt == null) {
            return false;
        }
        Instant now = Instant.now();
        return !now.isBefore(startAt) && now.isBefore(endAt);
    }

    private List<UUID> getAllVariantIds() {
        return itemRepository.findAll().stream()
                .map(item -> item.getVariant().getId())
                .distinct()
                .toList();
    }

    private void validateItemCanBeClaimed(FlashSaleItemEntity item) {
        FlashSaleCampaignEntity campaign = item.getCampaign();
        Instant now = Instant.now();
        if (campaign.getStatus() == FlashSaleCampaignStatus.CANCELLED || item.getStatus() != FlashSaleItemStatus.ACTIVE) {
            throw new AppException(ErrorCode.CONFLICT, "Flash sale is not active");
        }
        if (now.isBefore(campaign.getStartAt())) {
            throw new AppException(ErrorCode.CONFLICT, "Flash sale has not started yet");
        }
        if (now.isAfter(campaign.getEndAt())) {
            throw new AppException(ErrorCode.CONFLICT, "Flash sale has ended");
        }
    }

    private void persistCampaignItems(FlashSaleCampaignEntity campaign, List<CreateFlashSaleCampaignRequest.ItemRequest> itemRequests) {
        for (CreateFlashSaleCampaignRequest.ItemRequest itemRequest : itemRequests) {
            FlashSaleItemValidation validation = validateFlashSaleItem(itemRequest);
            FlashSaleItemEntity item = FlashSaleItemEntity.builder()
                    .campaign(campaign)
                    .variant(validation.variant())
                    .flashPrice(itemRequest.getFlashPrice())
                    .originalPrice(validation.variant().getSalePrice())
                    .saleStock(itemRequest.getSaleStock())
                    .perUserLimit(itemRequest.getPerUserLimit() != null ? itemRequest.getPerUserLimit() : 1)
                    .status(FlashSaleItemStatus.DRAFT)
                    .build();
            itemRepository.save(item);
        }
    }

    private void preloadRedis(FlashSaleItemEntity item) {
        stringRedisTemplate.opsForValue().set(stockKey(item.getId()), String.valueOf(item.getSaleStock()));
        stringRedisTemplate.opsForHash().put(reservationMetaKey(item.getId()), "flashPrice", item.getFlashPrice().toPlainString());
        stringRedisTemplate.opsForHash().put(reservationMetaKey(item.getId()), "originalPrice", item.getOriginalPrice().toPlainString());
        stringRedisTemplate.opsForHash().put(reservationMetaKey(item.getId()), "saleStock", String.valueOf(item.getSaleStock()));
        stringRedisTemplate.expire(stockKey(item.getId()), Duration.ofSeconds(reservationTtlSeconds * 12L));
    }

    private void restoreRedisItemStock(FlashSaleItemEntity item) {
        stringRedisTemplate.delete(stockKey(item.getId()));
        stringRedisTemplate.delete(reservationMetaKey(item.getId()));
    }

    private void restoreClaimedStock(FlashSaleItemEntity item, int quantity, UUID reservationId, UUID userId, String idempotencyKey) {
        stringRedisTemplate.opsForValue().increment(stockKey(item.getId()), quantity);
        stringRedisTemplate.opsForHash().increment(userKey(item.getId()), userId.toString(), -quantity);
        stringRedisTemplate.delete(reservationKey(item.getId(), reservationId));
        if (StringUtils.hasText(idempotencyKey)) {
            stringRedisTemplate.delete(idemKey(item.getId(), idempotencyKey));
        }
        webSocketBroadcaster.broadcast(TOPIC_PREFIX + item.getId(), Map.of(
                "itemId", item.getId().toString(),
                "remainingStock", getRemainingStock(item),
                "status", "RESTORED",
                "serverTime", Instant.now().toString()));
    }

    private String executeClaimScript(FlashSaleItemEntity item, UUID userId, int quantity, UUID reservationId, String idempotencyKey) {
        DefaultRedisScript<String> script = new DefaultRedisScript<>();
        script.setResultType(String.class);
        script.setScriptText("""
                local stockKey = KEYS[1]
                local userKey = KEYS[2]
                local reservationKey = KEYS[3]
                local idemKey = KEYS[4]
                local qty = tonumber(ARGV[1])
                local perUserLimit = tonumber(ARGV[2])
                local userId = ARGV[3]
                local itemId = ARGV[4]
                local reservationId = ARGV[5]
                local expiresAt = ARGV[6]
                local idempotencyKey = ARGV[7]
                local ttl = tonumber(ARGV[8])

                local existingReservation = redis.call('GET', idemKey)
                if existingReservation then
                    local currentStock = tonumber(redis.call('GET', stockKey) or '0')
                    return table.concat({'EXISTING', tostring(currentStock), existingReservation}, '|')
                end

                local stock = tonumber(redis.call('GET', stockKey) or '0')
                if stock < qty then
                    return 'ERR|OUT_OF_STOCK'
                end

                local claimed = tonumber(redis.call('HGET', userKey, userId) or '0')
                if claimed + qty > perUserLimit then
                    return 'ERR|PER_USER_LIMIT'
                end

                redis.call('DECRBY', stockKey, qty)
                local remaining = tonumber(redis.call('GET', stockKey) or '0')
                redis.call('HINCRBY', userKey, userId, qty)
                redis.call('HSET', reservationKey, 'itemId', itemId, 'userId', userId, 'quantity', tostring(qty), 'status', 'HELD', 'expiresAt', expiresAt, 'idempotencyKey', idempotencyKey)
                redis.call('EXPIRE', reservationKey, ttl)
                redis.call('SET', idemKey, reservationId, 'EX', ttl)
                return table.concat({'OK', tostring(remaining), reservationId}, '|')
                """);

        String result = stringRedisTemplate.execute(
                script,
                List.of(stockKey(item.getId()), userKey(item.getId()), reservationKey(item.getId(), reservationId), idemKey(item.getId(), idempotencyKey)),
                String.valueOf(quantity),
                String.valueOf(item.getPerUserLimit()),
                userId.toString(),
                item.getId().toString(),
                reservationId.toString(),
                String.valueOf(Instant.now().plusSeconds(reservationTtlSeconds).toEpochMilli()),
                idempotencyKey,
                String.valueOf(reservationTtlSeconds));
        return result != null ? result : "ERR|REDIS_FAILURE";
    }

    private ClaimResult parseClaimResult(String result) {
        String[] parts = result.split("\\|", 3);
        if (parts.length < 2) {
            return new ClaimResult("ERR", null, "Invalid claim response");
        }
        Integer remaining = null;
        String message = null;

        if ("ERR".equals(parts[0])) {
            message = parts[1];
        } else {
            try {
                remaining = Integer.parseInt(parts[1]);
            } catch (NumberFormatException ignored) {
            }
            if (parts.length >= 3) {
                message = parts[2];
            }
        }
        return new ClaimResult(parts[0], remaining, message);
    }

    private String resolveClaimErrorMessage(String reason) {
        if (!StringUtils.hasText(reason)) {
            return "Unable to claim flash sale stock";
        }
        return switch (reason) {
            case "OUT_OF_STOCK" -> "Flash sale stock is out of stock";
            case "PER_USER_LIMIT" -> "You have reached the flash sale limit";
            default -> reason;
        };
    }

    private FlashSaleCampaignResponse toCampaignResponse(FlashSaleCampaignEntity campaign) {
        List<FlashSaleItemResponse> items = itemRepository.findByCampaignId(campaign.getId()).stream()
                .map(this::toItemResponse)
                .toList();
        return FlashSaleCampaignResponse.builder()
                .id(campaign.getId().toString())
                .code(campaign.getCode())
                .name(campaign.getName())
                .description(campaign.getDescription())
                .type(campaign.getType())
                .coverImage(campaign.getCoverImage())
                .campaignDate(flashSaleSlotResolver.resolveCampaignDate(campaign.getStartAt()))
                .slotCode(campaign.getSlot())
                .slotLabel(campaign.getSlot() != null ? campaign.getSlot().getLabel() : null)
                .startAt(campaign.getStartAt())
                .endAt(campaign.getEndAt())
                .status(campaign.getStatus())
                .items(items)
                .build();
    }

    private FlashSaleCampaignResponse toCampaignResponse(CachedFlashSaleCampaign campaign) {
        return FlashSaleCampaignResponse.builder()
                .id(campaign.id())
                .code(campaign.code())
                .name(campaign.name())
                .description(campaign.description())
                .type(campaign.type())
                .coverImage(campaign.coverImage())
                .campaignDate(campaign.campaignDate())
                .slotCode(campaign.slotCode())
                .slotLabel(campaign.slotLabel())
                .startAt(campaign.startAt())
                .endAt(campaign.endAt())
                .status(campaign.status())
                .items(campaign.items().stream().map(this::toItemResponse).toList())
                .build();
    }

    private FlashSaleItemResponse toItemResponse(FlashSaleItemEntity item) {
        FlashSaleCampaignEntity campaign = item.getCampaign();
        return FlashSaleItemResponse.builder()
                .id(item.getId().toString())
                .campaignId(campaign.getId().toString())
                .campaignCode(campaign.getCode())
                .campaignName(campaign.getName())
                .variantId(item.getVariant().getId().toString())
                .variantSku(item.getVariant().getSku())
                .variantUnitType(item.getVariant().getUnitType())
                .productId(item.getVariant().getProduct().getId().toString())
                .productName(item.getVariant().getProduct().getWebName() != null ? item.getVariant().getProduct().getWebName() : item.getVariant().getProduct().getName())
                .productSlug(item.getVariant().getProduct().getSlug())
                .productImage(item.getVariant().getProduct().getPrimaryImage())
                .flashPrice(item.getFlashPrice())
                .originalPrice(item.getOriginalPrice())
                .saleStock(item.getSaleStock())
                .remainingStock(getRemainingStock(item.getId(), item.getSaleStock()))
                .perUserLimit(item.getPerUserLimit())
                .variantSpecification(item.getVariant().getSpecification())
                .startAt(campaign.getStartAt())
                .endAt(campaign.getEndAt())
                .status(item.getStatus())
                .build();
    }

    private FlashSaleItemResponse toItemResponse(CachedFlashSaleItem item) {
        return FlashSaleItemResponse.builder()
                .id(item.id())
                .campaignId(item.campaignId())
                .campaignCode(item.campaignCode())
                .campaignName(item.campaignName())
                .variantId(item.variantId())
                .variantSku(item.variantSku())
                .variantUnitType(item.variantUnitType())
                .productId(item.productId())
                .productName(item.productName())
                .productSlug(item.productSlug())
                .productImage(item.productImage())
                .flashPrice(item.flashPrice())
                .originalPrice(item.originalPrice())
                .saleStock(item.saleStock())
                .remainingStock(resolveRemainingStock(item))
                .perUserLimit(item.perUserLimit())
                .variantSpecification(item.variantSpecification())
                .startAt(item.startAt())
                .endAt(item.endAt())
                .status(item.status())
                .build();
    }

    private Integer resolveRemainingStock(CachedFlashSaleItem item) {
        try {
            return getRemainingStock(UUID.fromString(item.id()), item.saleStock());
        } catch (IllegalArgumentException ex) {
            log.warn("Invalid cached flash sale item id {}", item.id(), ex);
            return Math.max(item.saleStock() != null ? item.saleStock() : 0, 0);
        }
    }

    private List<CachedFlashSaleCampaign> loadBigEventCampaignSnapshots() {
        List<FlashSaleCampaignStatus> statuses = List.of(FlashSaleCampaignStatus.SCHEDULED, FlashSaleCampaignStatus.ACTIVE);
        return campaignRepository.findByTypeAndStatusInOrderByStartAtAsc(FlashSaleCampaignType.BIG_EVENT, statuses)
                .stream()
                .filter(this::isCustomerVisibleCampaign)
                .map(this::toCachedCampaign)
                .toList();
    }

    private List<CachedFlashSaleCampaign> loadCustomerCampaignSnapshots() {
        List<FlashSaleCampaignStatus> statuses = List.of(FlashSaleCampaignStatus.SCHEDULED, FlashSaleCampaignStatus.ACTIVE);
        return campaignRepository.findByStatusIn(statuses).stream()
                .filter(this::isCustomerVisibleCampaign)
                .sorted((left, right) -> {
                    int typeOrder = Integer.compare(campaignTypePriority(left.getType()), campaignTypePriority(right.getType()));
                    if (typeOrder != 0) {
                        return typeOrder;
                    }
                    return left.getStartAt().compareTo(right.getStartAt());
                })
                .map(this::toCachedCampaign)
                .toList();
    }

    private List<CachedFlashSaleItem> loadActiveItemSnapshots() {
        List<FlashSaleCampaignStatus> statuses = List.of(FlashSaleCampaignStatus.SCHEDULED, FlashSaleCampaignStatus.ACTIVE);
        return itemRepository.findActiveItemsByVariantIds(getAllVariantIds(), statuses, FlashSaleItemStatus.ACTIVE)
                .stream()
                .filter(this::isLiveFlashSaleItem)
                .map(this::toCachedItem)
                .toList();
    }

    private List<CachedFlashSaleItem> loadActiveItemSnapshotsByVariantIds(Collection<UUID> variantIds) {
        List<FlashSaleCampaignStatus> statuses = List.of(FlashSaleCampaignStatus.SCHEDULED, FlashSaleCampaignStatus.ACTIVE);
        return itemRepository.findActiveItemsByVariantIds(variantIds, statuses, FlashSaleItemStatus.ACTIVE)
                .stream()
                .filter(this::isLiveFlashSaleItem)
                .map(this::toCachedItem)
                .toList();
    }

    private CachedFlashSaleCampaign toCachedCampaign(FlashSaleCampaignEntity campaign) {
        return new CachedFlashSaleCampaign(
                campaign.getId().toString(),
                campaign.getCode(),
                campaign.getName(),
                campaign.getDescription(),
                campaign.getType(),
                campaign.getCoverImage(),
                flashSaleSlotResolver.resolveCampaignDate(campaign.getStartAt()),
                campaign.getSlot(),
                campaign.getSlot() != null ? campaign.getSlot().getLabel() : null,
                campaign.getStartAt(),
                campaign.getEndAt(),
                campaign.getStatus(),
                itemRepository.findByCampaignId(campaign.getId()).stream().map(this::toCachedItem).toList());
    }

    private CachedFlashSaleItem toCachedItem(FlashSaleItemEntity item) {
        FlashSaleCampaignEntity campaign = item.getCampaign();
        return new CachedFlashSaleItem(
                item.getId().toString(),
                campaign.getId().toString(),
                campaign.getCode(),
                campaign.getName(),
                item.getVariant().getId().toString(),
                item.getVariant().getSku(),
                item.getVariant().getUnitType(),
                item.getVariant().getProduct().getId().toString(),
                item.getVariant().getProduct().getWebName() != null ? item.getVariant().getProduct().getWebName() : item.getVariant().getProduct().getName(),
                item.getVariant().getProduct().getSlug(),
                item.getVariant().getProduct().getPrimaryImage(),
                item.getFlashPrice(),
                item.getOriginalPrice(),
                item.getSaleStock(),
                item.getPerUserLimit(),
                item.getVariant().getSpecification(),
                campaign.getStartAt(),
                campaign.getEndAt(),
                item.getStatus());
    }

    private <T> Optional<T> readCache(String key, TypeReference<T> type) {
        try {
            String payload = stringRedisTemplate.opsForValue().get(key);
            if (!StringUtils.hasText(payload)) {
                return Optional.empty();
            }
            return Optional.of(objectMapper.readValue(payload, type));
        } catch (IOException ex) {
            log.warn("Failed to deserialize flash sale cache {}", key, ex);
        } catch (RuntimeException ex) {
            log.warn("Failed to read flash sale cache {}", key, ex);
        }
        return Optional.empty();
    }

    private void writeCache(String key, Object payload, long ttlSeconds) {
        try {
            stringRedisTemplate.opsForValue().set(
                    key,
                    objectMapper.writeValueAsString(payload),
                    Duration.ofSeconds(Math.max(ttlSeconds, 1)));
        } catch (RuntimeException | IOException ex) {
            log.warn("Failed to write flash sale cache {}", key, ex);
        }
    }

    private void invalidateCustomerReadCaches() {
        deleteCacheKey(CUSTOMER_CAMPAIGN_LIST_CACHE_KEY);
        deleteCacheKey(BIG_EVENT_LIST_CACHE_KEY);
        deleteCacheKey(ACTIVE_ITEM_LIST_CACHE_KEY);
        deleteCachePattern(BIG_EVENT_DETAIL_CACHE_KEY_PREFIX + "*");
        deleteCachePattern(ITEM_DETAIL_CACHE_KEY_PREFIX + "*");
        deleteCachePattern(ACTIVE_ITEM_VARIANT_CACHE_KEY_PREFIX + "*");
    }

    private void deleteCachePattern(String pattern) {
        try {
            java.util.Set<String> keys = stringRedisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                stringRedisTemplate.delete(keys);
            }
        } catch (RuntimeException ex) {
            log.warn("Failed to delete flash sale cache pattern {}", pattern, ex);
        }
    }

    private void deleteCacheKey(String key) {
        try {
            stringRedisTemplate.delete(key);
        } catch (RuntimeException ex) {
            log.warn("Failed to delete flash sale cache key {}", key, ex);
        }
    }

    private String bigEventDetailCacheKey(String campaignCode) {
        return BIG_EVENT_DETAIL_CACHE_KEY_PREFIX + campaignCode.trim();
    }

    private String itemDetailCacheKey(UUID itemId) {
        return ITEM_DETAIL_CACHE_KEY_PREFIX + itemId;
    }

    private String activeItemsByVariantCacheKey(Collection<UUID> variantIds) {
        String normalized = variantIds.stream()
                .filter(java.util.Objects::nonNull)
                .map(UUID::toString)
                .sorted()
                .collect(Collectors.joining(","));
        UUID digest = UUID.nameUUIDFromBytes(normalized.getBytes(StandardCharsets.UTF_8));
        return ACTIVE_ITEM_VARIANT_CACHE_KEY_PREFIX + digest;
    }

    private UUID deterministicReservationId(UUID userId, UUID itemId, String idempotencyKey) {
        String raw = userId + ":" + itemId + ":" + idempotencyKey.trim();
        return UUID.nameUUIDFromBytes(raw.getBytes(StandardCharsets.UTF_8));
    }

    private String generateCampaignCode() {
        return "FSC" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    private String stockKey(UUID itemId) {
        return STOCK_KEY_PREFIX + itemId + ":stock";
    }

    private String userKey(UUID itemId) {
        return STOCK_KEY_PREFIX + itemId + USER_KEY_SUFFIX;
    }

    private String reservationMetaKey(UUID itemId) {
        return STOCK_KEY_PREFIX + itemId + ":meta";
    }

    private String reservationKey(UUID itemId, UUID reservationId) {
        return STOCK_KEY_PREFIX + itemId + RESERVATION_KEY_SUFFIX + reservationId;
    }

    private String idemKey(UUID itemId, String idempotencyKey) {
        return STOCK_KEY_PREFIX + itemId + ":idem:" + idempotencyKey.trim();
    }

    private record ClaimResult(String status, Integer remainingStock, String message) {
    }

    private record FlashSaleItemValidation(ProductVariantEntity variant, InventorySummaryEntity inventory) {
    }

    private record CachedFlashSaleCampaign(
            String id,
            String code,
            String name,
            String description,
            FlashSaleCampaignType type,
            String coverImage,
            LocalDate campaignDate,
            FlashSaleSlot slotCode,
            String slotLabel,
            Instant startAt,
            Instant endAt,
            FlashSaleCampaignStatus status,
            List<CachedFlashSaleItem> items) {
    }

    private record CachedFlashSaleItem(
            String id,
            String campaignId,
            String campaignCode,
            String campaignName,
            String variantId,
            String variantSku,
            String variantUnitType,
            String productId,
            String productName,
            String productSlug,
            String productImage,
            BigDecimal flashPrice,
            BigDecimal originalPrice,
            Integer saleStock,
            Integer perUserLimit,
            String variantSpecification,
            Instant startAt,
            Instant endAt,
            FlashSaleItemStatus status) {
    }
}
