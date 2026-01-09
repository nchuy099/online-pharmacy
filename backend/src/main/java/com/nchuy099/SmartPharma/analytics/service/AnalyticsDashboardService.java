package com.nchuy099.SmartPharma.analytics.service;

import com.nchuy099.SmartPharma.analytics.dto.response.AnalyticsDashboardResponse;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.event.enums.EventType;
import com.nchuy099.SmartPharma.event.repository.EventRepository;
import com.nchuy099.SmartPharma.order.domain.repository.OrderItemRepository;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.product.repository.ProductRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsDashboardService {

    private static final int TOP_PRODUCT_CANDIDATE_LIMIT = 20;
    private static final int TOP_PRODUCT_RESPONSE_LIMIT = 20;

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ChatConversationRepository chatConversationRepository;
    private final EventRepository eventRepository;

    @Value("${analytics.snapshot.zone-id:Asia/Ho_Chi_Minh}")
    private String snapshotZoneId;

    @Transactional(readOnly = true)
    public AnalyticsDashboardResponse getDashboardStats(LocalDate fromDate, LocalDate toDate) {
        ZoneId zoneId = ZoneId.of(snapshotZoneId);
        Instant start = fromDate.atStartOfDay(zoneId).toInstant();
        Instant endExclusive = toDate.plusDays(1).atStartOfDay(zoneId).toInstant();

        List<OrderItemRepository.ProductSalesProjection> salesStats =
                orderItemRepository.findProductSalesStatsByDeliveredAtBetween(start, endExclusive);
        Map<UUID, OrderItemRepository.ProductSalesProjection> salesByProductId = salesStats.stream()
                .filter(row -> row.getProductId() != null)
                .collect(Collectors.toMap(
                        OrderItemRepository.ProductSalesProjection::getProductId,
                        Function.identity(),
                        (left, right) -> left,
                        LinkedHashMap::new));

        List<UUID> candidateProductIds = collectCandidateProductIds(start, endExclusive, salesStats);
        Map<UUID, AnalyticsDashboardResponse.TopProduct> topProductById = buildTopProducts(
                candidateProductIds,
                start,
                endExclusive,
                salesByProductId);

        long newUsers = userRepository.countByCreatedAtBetween(start, endExclusive);
        long totalUsers = userRepository.countByCreatedAtBefore(endExclusive);
        long activeProducts = productRepository.countByIsActiveTrueAndCreatedAtBefore(endExclusive);
        long orders = orderRepository.countDeliveredByDeliveredAtBetween(start, endExclusive);
        long purchasingUsers = orderRepository.countDistinctDeliveredUsersByDeliveredAtBetween(start, endExclusive);
        long soldProducts = salesStats.stream()
                .map(OrderItemRepository.ProductSalesProjection::getPurchases)
                .filter(Objects::nonNull)
                .mapToLong(Long::longValue)
                .sum();

        BigDecimal revenueBd = orderRepository.sumDeliveredAmountByDeliveredAtBetween(start, endExclusive);
        BigDecimal costBd = salesStats.stream()
                .map(OrderItemRepository.ProductSalesProjection::getCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        double revenue = revenueBd.doubleValue();
        double profit = revenueBd.subtract(costBd).doubleValue();
        double aov = orders > 0 ? revenue / orders : 0.0;
        double marginPercent = revenue > 0 ? (profit / revenue) * 100.0 : 0.0;

        long chatbotConsultations = chatConversationRepository.countByTypeAndCreatedAtBetween("AI", start, endExclusive);
        long pharmacistConsultations = chatConversationRepository.countByTypeAndCreatedAtBetween("PHARMACIST", start, endExclusive);
        long consultations = chatbotConsultations + pharmacistConsultations;

        AnalyticsDashboardResponse.KpiStats scopeKpi = AnalyticsDashboardResponse.KpiStats.builder()
                .revenue(revenue)
                .profit(profit)
                .marginPercent(marginPercent)
                .orders(orders)
                .newUsers(newUsers)
                .totalUsers(totalUsers)
                .activeProducts(activeProducts)
                .soldProducts(soldProducts)
                .purchasingUsers(purchasingUsers)
                .aov(aov)
                .orderNew(orders)
                .orderCancelled(0L)
                .orderCompleted(orders)
                .consultations(consultations)
                .chatbotConsultations(chatbotConsultations)
                .pharmacistConsultations(pharmacistConsultations)
                .build();

        Comparator<AnalyticsDashboardResponse.TopProduct> topProductComparator = Comparator
                .comparingLong(AnalyticsDashboardResponse.TopProduct::getPurchases).reversed()
                .thenComparing(Comparator.comparingDouble(AnalyticsDashboardResponse.TopProduct::getRevenue).reversed());

        List<AnalyticsDashboardResponse.TopProduct> topProducts = topProductById.values().stream()
                .sorted(topProductComparator)
                .limit(TOP_PRODUCT_RESPONSE_LIMIT)
                .toList();

        return AnalyticsDashboardResponse.builder()
                .scopeKpi(scopeKpi)
                .topProducts(topProducts)
                .tableRows(topProducts)
                .build();
    }

    private List<UUID> collectCandidateProductIds(Instant start, Instant endExclusive,
                                                   List<OrderItemRepository.ProductSalesProjection> salesStats) {
        Set<UUID> ids = new LinkedHashSet<>();

        salesStats.stream()
                .sorted(Comparator.comparingLong((OrderItemRepository.ProductSalesProjection row) ->
                        row.getPurchases() != null ? row.getPurchases() : 0L).reversed())
                .limit(TOP_PRODUCT_CANDIDATE_LIMIT)
                .map(OrderItemRepository.ProductSalesProjection::getProductId)
                .filter(Objects::nonNull)
                .forEach(ids::add);

        salesStats.stream()
                .sorted(Comparator.comparing((OrderItemRepository.ProductSalesProjection row) ->
                        row.getRevenue() != null ? row.getRevenue() : BigDecimal.ZERO).reversed())
                .limit(TOP_PRODUCT_CANDIDATE_LIMIT)
                .map(OrderItemRepository.ProductSalesProjection::getProductId)
                .filter(Objects::nonNull)
                .forEach(ids::add);

        salesStats.stream()
                .sorted(Comparator.comparing((OrderItemRepository.ProductSalesProjection row) ->
                        row.getRevenue() != null && row.getCost() != null
                                ? row.getRevenue().subtract(row.getCost())
                                : BigDecimal.ZERO).reversed())
                .limit(TOP_PRODUCT_CANDIDATE_LIMIT)
                .map(OrderItemRepository.ProductSalesProjection::getProductId)
                .filter(Objects::nonNull)
                .forEach(ids::add);

        eventRepository.findTopProductEventCountsByTypeBetween(EventType.VIEW, start, endExclusive, PageRequest.of(0, TOP_PRODUCT_CANDIDATE_LIMIT))
                .stream()
                .map(EventRepository.ProductEventCountProjection::getProductId)
                .filter(Objects::nonNull)
                .forEach(ids::add);

        eventRepository.findTopProductEventCountsByTypeBetween(EventType.ADD_TO_CART, start, endExclusive, PageRequest.of(0, TOP_PRODUCT_CANDIDATE_LIMIT))
                .stream()
                .map(EventRepository.ProductEventCountProjection::getProductId)
                .filter(Objects::nonNull)
                .forEach(ids::add);

        return ids.stream().toList();
    }

    private Map<UUID, AnalyticsDashboardResponse.TopProduct> buildTopProducts(
            List<UUID> candidateProductIds,
            Instant start,
            Instant endExclusive,
            Map<UUID, OrderItemRepository.ProductSalesProjection> salesByProductId) {
        if (candidateProductIds.isEmpty()) {
            return Map.of();
        }

        Map<UUID, ProductEntity> productById = productRepository.findByIdIn(candidateProductIds).stream()
                .collect(Collectors.toMap(ProductEntity::getId, Function.identity(), (left, right) -> left, LinkedHashMap::new));

        Map<UUID, Long> viewCounts = loadEventCounts(EventType.VIEW, candidateProductIds, start, endExclusive);
        Map<UUID, Long> addToCartCounts = loadEventCounts(EventType.ADD_TO_CART, candidateProductIds, start, endExclusive);

        Map<UUID, AnalyticsDashboardResponse.TopProduct> topProductById = new LinkedHashMap<>();
        for (UUID productId : candidateProductIds) {
            ProductEntity product = productById.get(productId);
            if (product == null) {
                continue;
            }
            OrderItemRepository.ProductSalesProjection sales = salesByProductId.get(productId);

            ProductVariantEntity variant = resolveDisplayVariant(product);
            long views = viewCounts.getOrDefault(productId, 0L);
            long addToCart = addToCartCounts.getOrDefault(productId, 0L);
            long purchases = sales != null && sales.getPurchases() != null ? sales.getPurchases() : 0L;
            double revenue = sales != null && sales.getRevenue() != null ? sales.getRevenue().doubleValue() : 0.0;
            double profit = sales != null && sales.getRevenue() != null && sales.getCost() != null
                    ? sales.getRevenue().subtract(sales.getCost()).doubleValue()
                    : 0.0;
            double conversionRate = views > 0 ? (purchases * 100.0) / views : 0.0;

            topProductById.put(productId, AnalyticsDashboardResponse.TopProduct.builder()
                    .id(productId.toString())
                    .image(product.getPrimaryImage())
                    .name(product.getName())
                    .sku(variant != null ? variant.getSku() : "")
                    .unitPrice(variant != null && variant.getSalePrice() != null ? variant.getSalePrice().doubleValue() : 0.0)
                    .packageType(variant != null ? variant.getUnit() : "")
                    .views(views)
                    .addToCart(addToCart)
                    .purchases(purchases)
                    .revenue(revenue)
                    .profit(profit)
                    .conversionRate(conversionRate)
                    .build());
        }

        return topProductById;
    }

    private Map<UUID, Long> loadEventCounts(EventType eventType, List<UUID> productIds, Instant start, Instant endExclusive) {
        if (productIds.isEmpty()) {
            return Map.of();
        }

        return eventRepository.countProductEventCountsByTypeAndProductIdsBetween(eventType, start, endExclusive, productIds).stream()
                .filter(row -> row.getProductId() != null)
                .collect(Collectors.toMap(
                        EventRepository.ProductEventCountProjection::getProductId,
                        row -> row.getTotal() != null ? row.getTotal() : 0L,
                        (left, right) -> left,
                        LinkedHashMap::new));
    }

    private ProductVariantEntity resolveDisplayVariant(ProductEntity product) {
        if (product.getVariants() == null || product.getVariants().isEmpty()) {
            return null;
        }

        return product.getVariants().stream()
                .filter(variant -> Boolean.TRUE.equals(variant.getIsDefault()))
                .findFirst()
                .or(() -> product.getVariants().stream().findFirst())
                .orElse(null);
    }
}
