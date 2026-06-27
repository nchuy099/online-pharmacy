package com.nchuy099.SmartPharma.flashsale.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.flashsale.config.FlashSaleWebSocketBroadcaster;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignStatus;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignType;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleItemStatus;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleSlot;
import com.nchuy099.SmartPharma.flashsale.dto.request.ClaimFlashSaleRequest;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleCampaignResponse;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleItemResponse;
import com.nchuy099.SmartPharma.flashsale.entity.FlashSaleCampaignEntity;
import com.nchuy099.SmartPharma.flashsale.entity.FlashSaleItemEntity;
import com.nchuy099.SmartPharma.flashsale.repository.FlashSaleCampaignRepository;
import com.nchuy099.SmartPharma.flashsale.repository.FlashSaleItemRepository;
import com.nchuy099.SmartPharma.flashsale.repository.FlashSaleReservationRepository;
import com.nchuy099.SmartPharma.inventory.entity.InventoryEntity;
import com.nchuy099.SmartPharma.inventory.repository.InventoryRepository;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.product.repository.ProductVariantRepository;
import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.enums.RoleType;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class FlashSaleServiceTest {

    private FlashSaleCampaignRepository campaignRepository;
    private FlashSaleItemRepository itemRepository;
    private FlashSaleReservationRepository reservationRepository;
    private ProductVariantRepository productVariantRepository;
    private InventoryRepository inventoryRepository;
    private OrderRepository orderRepository;
    private UserRepository userRepository;
    private SecurityUtils securityUtils;
    private StringRedisTemplate stringRedisTemplate;
    private FlashSaleWebSocketBroadcaster webSocketBroadcaster;
    private FlashSaleSlotResolver flashSaleSlotResolver;
    private FlashSaleService service;

    private Map<String, String> redisValues;
    private ValueOperations<String, String> valueOperations;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        campaignRepository = mock(FlashSaleCampaignRepository.class);
        itemRepository = mock(FlashSaleItemRepository.class);
        reservationRepository = mock(FlashSaleReservationRepository.class);
        productVariantRepository = mock(ProductVariantRepository.class);
        inventoryRepository = mock(InventoryRepository.class);
        orderRepository = mock(OrderRepository.class);
        userRepository = mock(UserRepository.class);
        securityUtils = mock(SecurityUtils.class);
        stringRedisTemplate = mock(StringRedisTemplate.class);
        webSocketBroadcaster = mock(FlashSaleWebSocketBroadcaster.class);
        flashSaleSlotResolver = new FlashSaleSlotResolver("Asia/Ho_Chi_Minh");

        valueOperations = mock(ValueOperations.class);
        HashOperations<String, Object, Object> hashOperations = mock(HashOperations.class);
        redisValues = new HashMap<>();

        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(stringRedisTemplate.opsForHash()).thenReturn(hashOperations);
        when(valueOperations.get(anyString())).thenAnswer(invocation -> redisValues.get(invocation.getArgument(0)));
        doAnswer(invocation -> {
            redisValues.put(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(valueOperations).set(anyString(), anyString());
        doAnswer(invocation -> {
            redisValues.put(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(valueOperations).set(anyString(), anyString(), any(Duration.class));
        when(valueOperations.increment(anyString(), org.mockito.ArgumentMatchers.anyLong())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            long delta = invocation.getArgument(1);
            long current = Long.parseLong(redisValues.getOrDefault(key, "0"));
            long updated = current + delta;
            redisValues.put(key, String.valueOf(updated));
            return updated;
        });
        when(stringRedisTemplate.expire(anyString(), any(Duration.class))).thenReturn(true);
        doAnswer(invocation -> {
            redisValues.remove(invocation.getArgument(0));
            return true;
        }).when(stringRedisTemplate).delete(anyString());
        doAnswer(invocation -> {
            Collection<String> keys = invocation.getArgument(0);
            long removed = 0;
            for (String key : keys) {
                if (redisValues.remove(key) != null) {
                    removed++;
                }
            }
            return removed;
        }).when(stringRedisTemplate).delete(anyCollection());
        when(stringRedisTemplate.keys(anyString())).thenAnswer(invocation -> {
            String pattern = invocation.getArgument(0);
            if (!pattern.endsWith("*")) {
                return redisValues.containsKey(pattern) ? Set.of(pattern) : Set.of();
            }
            String prefix = pattern.substring(0, pattern.length() - 1);
            return redisValues.keySet().stream()
                    .filter(key -> key.startsWith(prefix))
                    .collect(Collectors.toSet());
        });

        service = new FlashSaleService(
                campaignRepository,
                itemRepository,
                reservationRepository,
                productVariantRepository,
                inventoryRepository,
                orderRepository,
                userRepository,
                securityUtils,
                stringRedisTemplate,
                webSocketBroadcaster,
                flashSaleSlotResolver,
                new ObjectMapper().findAndRegisterModules());

        ReflectionTestUtils.setField(service, "reservationTtlSeconds", 300);
        ReflectionTestUtils.setField(service, "campaignCacheTtlSeconds", 30L);
        ReflectionTestUtils.setField(service, "itemCacheTtlSeconds", 15L);
    }

    @Test
    void getCustomerCampaignsShouldReuseCacheAndRefreshRemainingStock() {
        FlashSaleCampaignEntity campaign = campaign("FSC001", FlashSaleCampaignType.NORMAL, Instant.now().minusSeconds(60), Instant.now().plusSeconds(3600));
        FlashSaleItemEntity item = item(campaign, BigDecimal.valueOf(90000), 10);
        redisValues.put(stockKey(item.getId()), "5");

        when(campaignRepository.findByStatusIn(anyList())).thenReturn(List.of(campaign));
        when(itemRepository.findByCampaignId(campaign.getId())).thenReturn(List.of(item));

        List<FlashSaleCampaignResponse> firstRead = service.getCustomerCampaigns();
        assertEquals(1, firstRead.size());
        assertEquals(5, firstRead.get(0).getItems().get(0).getRemainingStock());

        redisValues.put(stockKey(item.getId()), "2");
        List<FlashSaleCampaignResponse> secondRead = service.getCustomerCampaigns();

        assertEquals(1, secondRead.size());
        assertEquals(2, secondRead.get(0).getItems().get(0).getRemainingStock());
        verify(campaignRepository, times(1)).findByStatusIn(anyList());
        verify(itemRepository, times(1)).findByCampaignId(campaign.getId());
    }

    @Test
    void getBigEventCampaignByCodeShouldReuseCacheAndRefreshRemainingStock() {
        FlashSaleCampaignEntity campaign = campaign("BIG001", FlashSaleCampaignType.BIG_EVENT, Instant.now().minusSeconds(60), Instant.now().plusSeconds(3600));
        FlashSaleItemEntity item = item(campaign, BigDecimal.valueOf(79000), 8);
        redisValues.put(stockKey(item.getId()), "6");

        when(campaignRepository.findByCode("BIG001")).thenReturn(Optional.of(campaign));
        when(itemRepository.findByCampaignId(campaign.getId())).thenReturn(List.of(item));

        FlashSaleCampaignResponse firstRead = service.getBigEventCampaignByCode("BIG001");
        assertEquals("BIG001", firstRead.getCode());
        assertEquals(6, firstRead.getItems().get(0).getRemainingStock());

        redisValues.put(stockKey(item.getId()), "1");
        FlashSaleCampaignResponse secondRead = service.getBigEventCampaignByCode("BIG001");

        assertEquals("BIG001", secondRead.getCode());
        assertEquals(1, secondRead.getItems().get(0).getRemainingStock());
        verify(campaignRepository, times(1)).findByCode("BIG001");
        verify(itemRepository, times(1)).findByCampaignId(campaign.getId());
    }

    @Test
    void publishCampaignShouldInvalidateCustomerCaches() {
        FlashSaleCampaignEntity campaign = campaign("BIG999", FlashSaleCampaignType.BIG_EVENT, Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200));
        campaign.setStatus(FlashSaleCampaignStatus.DRAFT);
        FlashSaleItemEntity item = item(campaign, BigDecimal.valueOf(55000), 5);
        item.setStatus(FlashSaleItemStatus.DRAFT);

        InventoryEntity inventory = InventoryEntity.builder()
                .variant(item.getVariant())
                .quantityOnHand(100)
                .quantityReserved(0)
                .build();
        inventory.setId(UUID.randomUUID());

        redisValues.put("flash:sale:cache:campaigns:customer", "cached");
        redisValues.put("flash:sale:cache:campaigns:events", "cached");
        redisValues.put("flash:sale:cache:items:active", "cached");
        redisValues.put("flash:sale:cache:campaigns:event:BIG999", "cached");
        redisValues.put("flash:sale:cache:items:detail:" + item.getId(), "cached");
        redisValues.put("flash:sale:cache:items:variants:test", "cached");

        when(campaignRepository.findById(campaign.getId())).thenReturn(Optional.of(campaign));
        when(itemRepository.findByCampaignId(campaign.getId())).thenReturn(List.of(item));
        when(productVariantRepository.findByIdWithProduct(item.getVariant().getId())).thenReturn(Optional.of(item.getVariant()));
        when(inventoryRepository.reserveQuantity(inventory.getId(), item.getSaleStock())).thenReturn(1);
        when(inventoryRepository.findByVariant_Id(item.getVariant().getId())).thenReturn(Optional.of(inventory));
        when(campaignRepository.save(any(FlashSaleCampaignEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(itemRepository.save(any(FlashSaleItemEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FlashSaleCampaignResponse published = service.publishCampaign(campaign.getId());

        assertNotNull(published);
        assertEquals(FlashSaleCampaignStatus.SCHEDULED, campaign.getStatus());
        assertEquals(FlashSaleItemStatus.ACTIVE, item.getStatus());
        assertEquals("5", redisValues.get(stockKey(item.getId())));
        assertEquals(null, redisValues.get("flash:sale:cache:campaigns:customer"));
        assertEquals(null, redisValues.get("flash:sale:cache:campaigns:events"));
        assertEquals(null, redisValues.get("flash:sale:cache:items:active"));
        assertEquals(null, redisValues.get("flash:sale:cache:campaigns:event:BIG999"));
        assertEquals(null, redisValues.get("flash:sale:cache:items:detail:" + item.getId()));
        assertEquals(null, redisValues.get("flash:sale:cache:items:variants:test"));
    }

    @Test
    void getActiveItemsByVariantIdsShouldHideScheduledItemsBeforeStartTime() {
        FlashSaleCampaignEntity campaign = campaign("FUTURE001", FlashSaleCampaignType.NORMAL, Instant.now().plusSeconds(600), Instant.now().plusSeconds(3600));
        campaign.setStatus(FlashSaleCampaignStatus.SCHEDULED);
        FlashSaleItemEntity item = item(campaign, BigDecimal.valueOf(85000), 6);

        when(itemRepository.findActiveItemsByVariantIds(eq(List.of(item.getVariant().getId())), anyList(), eq(FlashSaleItemStatus.ACTIVE)))
                .thenReturn(List.of(item));

        List<FlashSaleItemResponse> result = service.getActiveItemsByVariantIds(List.of(item.getVariant().getId()));

        assertEquals(List.of(), result);
    }

    @Test
    void getActiveItemsByVariantIdsShouldReturnScheduledItemsOnceWindowStarts() {
        FlashSaleCampaignEntity campaign = campaign("LIVE001", FlashSaleCampaignType.NORMAL, Instant.now().minusSeconds(60), Instant.now().plusSeconds(3600));
        campaign.setStatus(FlashSaleCampaignStatus.SCHEDULED);
        FlashSaleItemEntity item = item(campaign, BigDecimal.valueOf(85000), 6);
        redisValues.put(stockKey(item.getId()), "4");

        when(itemRepository.findActiveItemsByVariantIds(eq(List.of(item.getVariant().getId())), anyList(), eq(FlashSaleItemStatus.ACTIVE)))
                .thenReturn(List.of(item));

        List<FlashSaleItemResponse> result = service.getActiveItemsByVariantIds(List.of(item.getVariant().getId()));

        assertEquals(1, result.size());
        assertEquals(item.getId().toString(), result.get(0).getId());
        assertEquals(4, result.get(0).getRemainingStock());
    }

    @Test
    void parseClaimResultShouldExtractErrorReason() {
        Object result = ReflectionTestUtils.invokeMethod(service, "parseClaimResult", "ERR|OUT_OF_STOCK");
        assertNotNull(result);
        assertEquals("ERR", ReflectionTestUtils.getField(result, "status"));
        assertEquals("OUT_OF_STOCK", ReflectionTestUtils.getField(result, "message"));
    }

    @Test
    void resolveClaimErrorMessageShouldMapKnownReasons() {
        Object outOfStock = ReflectionTestUtils.invokeMethod(service, "resolveClaimErrorMessage", "OUT_OF_STOCK");
        Object perUserLimit = ReflectionTestUtils.invokeMethod(service, "resolveClaimErrorMessage", "PER_USER_LIMIT");
        Object fallback = ReflectionTestUtils.invokeMethod(service, "resolveClaimErrorMessage", "SOMETHING_ELSE");

        assertEquals("Flash sale stock is out of stock", outOfStock);
        assertEquals("You have reached the flash sale limit", perUserLimit);
        assertEquals("SOMETHING_ELSE", fallback);
    }

    private FlashSaleCampaignEntity campaign(String code, FlashSaleCampaignType type, Instant startAt, Instant endAt) {
        FlashSaleCampaignEntity campaign = FlashSaleCampaignEntity.builder()
                .code(code)
                .name(code + " campaign")
                .description("desc")
                .type(type)
                .slot(FlashSaleSlot.MORNING_09_11)
                .coverImage(type == FlashSaleCampaignType.BIG_EVENT ? "https://img.example.com/banner.png" : null)
                .startAt(startAt)
                .endAt(endAt)
                .status(FlashSaleCampaignStatus.ACTIVE)
                .items(new ArrayList<>())
                .build();
        campaign.setId(UUID.randomUUID());
        return campaign;
    }

    private FlashSaleItemEntity item(FlashSaleCampaignEntity campaign, BigDecimal flashPrice, int saleStock) {
        ProductEntity product = ProductEntity.builder()
                .name("Product " + campaign.getCode())
                .webName("Product " + campaign.getCode())
                .slug("product-" + campaign.getCode().toLowerCase())
                .isActive(true)
                .build();
        product.setId(UUID.randomUUID());
        product.setPrimaryImage("https://img.example.com/" + campaign.getCode() + ".png");

        ProductVariantEntity variant = ProductVariantEntity.builder()
                .product(product)
                .sku("SKU-" + campaign.getCode())
                .unitType("Hộp")
                .specification("10 viên")
                .salePrice(BigDecimal.valueOf(100000))
                .isActive(true)
                .build();
        variant.setId(UUID.randomUUID());

        FlashSaleItemEntity item = FlashSaleItemEntity.builder()
                .campaign(campaign)
                .variant(variant)
                .flashPrice(flashPrice)
                .originalPrice(BigDecimal.valueOf(100000))
                .saleStock(saleStock)
                .perUserLimit(1)
                .status(FlashSaleItemStatus.ACTIVE)
                .build();
        item.setId(UUID.randomUUID());
        campaign.getItems().add(item);
        return item;
    }

    private void userRepositoryStub(UUID userId) {
        RoleEntity role = RoleEntity.builder()
                .name("CUSTOMER")
                .roleType(RoleType.CUSTOMER)
                .build();
        role.setId(UUID.randomUUID());

        UserEntity user = UserEntity.builder()
                .email("user@example.com")
                .fullName("Test User")
                .password("secret")
                .role(role)
                .build();
        user.setId(userId);

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    }

    private ClaimFlashSaleRequest claimRequest() {
        ClaimFlashSaleRequest request = new ClaimFlashSaleRequest();
        request.setQuantity(1);
        request.setIdempotencyKey(UUID.randomUUID().toString());
        return request;
    }

    private String stockKey(UUID itemId) {
        return "flash:sale:item:" + itemId + ":stock";
    }
}
