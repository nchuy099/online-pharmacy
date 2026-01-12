package com.nchuy099.SmartPharma.analytics.service;

import com.nchuy099.SmartPharma.analytics.dto.response.AnalyticsDashboardResponse;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.event.enums.EventType;
import com.nchuy099.SmartPharma.event.repository.EventRepository;
import com.nchuy099.SmartPharma.order.domain.repository.OrderItemRepository;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductImageEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.product.repository.ProductRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AnalyticsDashboardServiceTest {

    private UserRepository userRepository;
    private ProductRepository productRepository;
    private OrderRepository orderRepository;
    private OrderItemRepository orderItemRepository;
    private ChatConversationRepository chatConversationRepository;
    private EventRepository eventRepository;
    private AnalyticsDashboardService analyticsDashboardService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        productRepository = mock(ProductRepository.class);
        orderRepository = mock(OrderRepository.class);
        orderItemRepository = mock(OrderItemRepository.class);
        chatConversationRepository = mock(ChatConversationRepository.class);
        eventRepository = mock(EventRepository.class);

        analyticsDashboardService = new AnalyticsDashboardService(
                userRepository,
                productRepository,
                orderRepository,
                orderItemRepository,
                chatConversationRepository,
                eventRepository);
        ReflectionTestUtils.setField(analyticsDashboardService, "snapshotZoneId", "Asia/Ho_Chi_Minh");
    }

    @Test
    void getDashboardStatsShouldAggregateRealMetricsAndTopProducts() {
        LocalDate from = LocalDate.of(2026, 4, 1);
        LocalDate to = LocalDate.of(2026, 4, 10);

        UUID product1Id = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID product2Id = UUID.fromString("22222222-2222-2222-2222-222222222222");

        when(orderItemRepository.findProductSalesStatsByDeliveredAtBetween(any(), any()))
                .thenReturn(List.of(
                        salesRow(product1Id, 12L, BigDecimal.valueOf(1200000), BigDecimal.valueOf(720000)),
                        salesRow(product2Id, 5L, BigDecimal.valueOf(700000), BigDecimal.valueOf(400000))));
        when(orderRepository.sumDeliveredAmountByDeliveredAtBetween(any(), any()))
                .thenReturn(BigDecimal.valueOf(1900000));

        when(eventRepository.findTopProductEventCountsByTypeBetween(eq(EventType.VIEW), any(), any(), any()))
                .thenReturn(List.of(eventRow(product1Id, 300L), eventRow(product2Id, 180L)));
        when(eventRepository.findTopProductEventCountsByTypeBetween(eq(EventType.ADD_TO_CART), any(), any(), any()))
                .thenReturn(List.of(eventRow(product1Id, 45L), eventRow(product2Id, 20L)));
        when(eventRepository.countProductEventCountsByTypeAndProductIdsBetween(eq(EventType.VIEW), any(), any(), any()))
                .thenReturn(List.of(eventRow(product1Id, 300L), eventRow(product2Id, 180L)));
        when(eventRepository.countProductEventCountsByTypeAndProductIdsBetween(eq(EventType.ADD_TO_CART), any(), any(), any()))
                .thenReturn(List.of(eventRow(product1Id, 45L), eventRow(product2Id, 20L)));

        when(productRepository.findByIdIn(anyList()))
                .thenReturn(List.of(
                        product(product1Id, "Product A", "A-001", "Hộp", BigDecimal.valueOf(100000), "https://cdn.example/a.jpg"),
                        product(product2Id, "Product B", "B-001", "Lọ", BigDecimal.valueOf(140000), "https://cdn.example/b.jpg")));

        when(userRepository.countByCreatedAtBetween(any(), any())).thenReturn(33L);
        when(userRepository.countByCreatedAtBefore(any())).thenReturn(200L);
        when(productRepository.countByIsActiveTrueAndCreatedAtBefore(any())).thenReturn(55L);
        when(orderRepository.countDeliveredByDeliveredAtBetween(any(), any())).thenReturn(17L);
        when(orderRepository.countDistinctDeliveredUsersByDeliveredAtBetween(any(), any())).thenReturn(14L);
        when(chatConversationRepository.countByTypeAndCreatedAtBetween(eq("AI"), any(), any())).thenReturn(8L);
        when(chatConversationRepository.countByTypeAndCreatedAtBetween(eq("PHARMACIST"), any(), any())).thenReturn(6L);

        AnalyticsDashboardResponse response = analyticsDashboardService.getDashboardStats(from, to);

        assertNotNull(response);
        assertNotNull(response.getScopeKpi());
        assertEquals(33L, response.getScopeKpi().getNewUsers());
        assertEquals(200L, response.getScopeKpi().getTotalUsers());
        assertEquals(55L, response.getScopeKpi().getActiveProducts());
        assertEquals(17L, response.getScopeKpi().getOrders());
        assertEquals(14L, response.getScopeKpi().getPurchasingUsers());
        assertEquals(1900000.0, response.getScopeKpi().getRevenue());
        assertEquals(780000.0, response.getScopeKpi().getProfit());
        assertEquals(14L, response.getScopeKpi().getConsultations());
        assertEquals(8L, response.getScopeKpi().getChatbotConsultations());
        assertEquals(6L, response.getScopeKpi().getPharmacistConsultations());
        assertEquals(17L, response.getScopeKpi().getSoldProducts());

        assertFalse(response.getTopProducts().isEmpty());
        AnalyticsDashboardResponse.TopProduct topProduct = response.getTopProducts().get(0);
        assertEquals(product1Id.toString(), topProduct.getId());
        assertEquals(300L, topProduct.getViews());
        assertEquals(45L, topProduct.getAddToCart());
        assertEquals(12L, topProduct.getPurchases());
        assertEquals("Product A", topProduct.getName());
        assertEquals("A-001", topProduct.getSku());
        assertEquals("Hộp", topProduct.getPackageType());
        assertEquals(1200000.0, topProduct.getRevenue());
        assertEquals(480000.0, topProduct.getProfit());
    }

    private OrderItemRepository.ProductSalesProjection salesRow(UUID productId, long purchases, BigDecimal revenue, BigDecimal cost) {
        return new OrderItemRepository.ProductSalesProjection() {
            @Override
            public UUID getProductId() {
                return productId;
            }

            @Override
            public Long getPurchases() {
                return purchases;
            }

            @Override
            public BigDecimal getRevenue() {
                return revenue;
            }

            @Override
            public BigDecimal getCost() {
                return cost;
            }
        };
    }

    private EventRepository.ProductEventCountProjection eventRow(UUID productId, long total) {
        return new EventRepository.ProductEventCountProjection() {
            @Override
            public UUID getProductId() {
                return productId;
            }

            @Override
            public Long getTotal() {
                return total;
            }
        };
    }

    private ProductEntity product(UUID id, String name, String sku, String unit, BigDecimal salePrice, String imageUrl) {
        ProductEntity product = ProductEntity.builder()
                .name(name)
                .build();
        product.setId(id);

        ProductVariantEntity variant = ProductVariantEntity.builder()
                .sku(sku)
                .unitType(unit)
                .salePrice(salePrice)
                .isDefault(true)
                .build();
        variant.setId(UUID.randomUUID());
        variant.setProduct(product);

        ProductImageEntity image = ProductImageEntity.builder()
                .url(imageUrl)
                .isPrimary(true)
                .build();
        image.setId(UUID.randomUUID());
        image.setProduct(product);

        product.setVariants(List.of(variant));
        product.setImages(List.of(image));
        return product;
    }
}
