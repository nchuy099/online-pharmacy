package com.nchuy099.SmartPharma.analytics.service;

import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.analytics.dto.response.AnalyticsStatsResponse;
import com.nchuy099.SmartPharma.analytics.dto.response.AnalyticsSnapshotSummaryResponse;
import com.nchuy099.SmartPharma.order.domain.repository.OrderItemRepository;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventorySummaryRepository;
import com.nchuy099.SmartPharma.product.repository.ProductRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final InventorySummaryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final ChatConversationRepository chatConversationRepository;
    private final AnalyticsSnapshotService analyticsSnapshotService;
    private final AnalyticsSnapshotQueryService analyticsSnapshotQueryService;

    public AnalyticsStatsResponse getAnalyticsStats() {
        log.info("Calculating analytics statistics");

        // 1. Business Stats (snapshot-based)
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        analyticsSnapshotService.upsertForDate(today, false);
        AnalyticsSnapshotSummaryResponse summary = analyticsSnapshotQueryService.getSummary(today);

        Instant startOfDay = today.atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
        Instant endOfDay = startOfDay.plus(1, ChronoUnit.DAYS);

        double totalRevenue = summary.getRevenue().getTotal().doubleValue();
        BigDecimal totalCostBd = orderItemRepository.sumTotalCostAmount();
        double totalCost = totalCostBd != null ? totalCostBd.doubleValue() : 0.0;
        double totalProfit = totalRevenue - totalCost;

        double todayRevenue = summary.getRevenue().getNewlyAdded().doubleValue();
        BigDecimal todayCostBd = orderItemRepository.sumTotalCostAmountByCreatedAtBetween(startOfDay, endOfDay);
        double todayCost = todayCostBd != null ? todayCostBd.doubleValue() : 0.0;
        double todayProfit = todayRevenue - todayCost;

        long totalOrders = summary.getOrders().getTotal();
        long todayOrders = summary.getOrders().getNewlyAdded();

        double averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0.0;
        double todayAov = todayOrders > 0 ? todayRevenue / todayOrders : 0.0;

        AnalyticsStatsResponse.BusinessStats businessStats = AnalyticsStatsResponse.BusinessStats.builder()
                .totalRevenue(totalRevenue)
                .totalProfit(totalProfit)
                .totalOrders(totalOrders)
                .averageOrderValue(averageOrderValue)
                .todayRevenue(todayRevenue)
                .todayProfit(todayProfit)
                .todayOrders(todayOrders)
                .todayAov(todayAov)
                .build();

        // 2. Order Stats
        AnalyticsStatsResponse.OrderStats orderStats = AnalyticsStatsResponse.OrderStats.builder()
                .pendingOrders(orderRepository.countByStatus(OrderStatus.PENDING))
                .shippingOrders(orderRepository.countByStatus(OrderStatus.SHIPPING))
                .completedOrders(orderRepository.countByStatus(OrderStatus.DELIVERED))
                .cancelledOrders(orderRepository.countByStatus(OrderStatus.CANCELLED))
                .build();

        // 3. Product Stats
        long totalProducts = summary.getProducts().getTotal();
        int LOW_STOCK_THRESHOLD = 10;
        long lowStockCount = inventoryRepository.countLowStockVariants(LOW_STOCK_THRESHOLD);
        
        List<AnalyticsStatsResponse.LowStockProduct> lowStockProducts = inventoryRepository
                .findLowStockVariants(LOW_STOCK_THRESHOLD, PageRequest.of(0, 5))
                .stream()
                .map(inv -> (Object) AnalyticsStatsResponse.LowStockProduct.builder()
                        .name(inv.getVariant().getProduct().getName() + " (" + inv.getVariant().getUnit() + ")")
                        .remainingQuantity(inv.getQuantityAvailable())
                        .build())
                .map(o -> (AnalyticsStatsResponse.LowStockProduct) o)
                .collect(Collectors.toList());

        List<AnalyticsStatsResponse.TopProduct> topSellingProducts = orderItemRepository
                .findTopSellingProducts(PageRequest.of(0, 5))
                .stream()
                .map(p -> AnalyticsStatsResponse.TopProduct.builder()
                        .name(p.getName())
                        .soldQuantity(p.getSoldQuantity())
                        .build())
                .collect(Collectors.toList());

        AnalyticsStatsResponse.ProductStats productStats = AnalyticsStatsResponse.ProductStats.builder()
                .totalProducts(totalProducts)
                .topSellingProducts(topSellingProducts)
                .lowStockCount(lowStockCount)
                .lowStockProducts(lowStockProducts)
                .build();

        // 4. User Stats
        long totalUsers = summary.getUsers().getTotal();
        long newUsersToday = summary.getUsers().getNewlyAdded();
        Map<String, Long> roleCounts = new HashMap<>();
        userRepository.countUsersByRole()
                .forEach(item -> roleCounts.put(item.getRoleName(), item.getTotal()));

        AnalyticsStatsResponse.UserStats userStats = AnalyticsStatsResponse.UserStats.builder()
                .totalUsers(totalUsers)
                .newUsersToday(newUsersToday)
                .totalPharmacists(roleCounts.getOrDefault("PHARMACIST", 0L))
                .totalCustomers(roleCounts.getOrDefault("CUSTOMER", 0L))
                .totalStaff(roleCounts.getOrDefault("STAFF", 0L))
                .totalSuperAdmins(roleCounts.getOrDefault("SUPER_ADMIN", 0L))
                .build();

        // 5. Consultation Stats
        long totalQuestions = summary.getConsultations().getTotal();
        long pharmacistConsultations = chatConversationRepository.countByType("PHARMACIST");
        long chatbotConsultations = chatConversationRepository.countByType("AI");

        AnalyticsStatsResponse.ConsultationStats consultationStats = AnalyticsStatsResponse.ConsultationStats.builder()
                .totalQuestions(totalQuestions)
                .pharmacistConsultations(pharmacistConsultations)
                .chatbotConsultations(chatbotConsultations)
                .build();

        // Assembly
        return AnalyticsStatsResponse.builder()
                .business(businessStats)
                .orders(orderStats)
                .products(productStats)
                .users(userStats)
                .consultations(consultationStats)
                .build();
    }
}
