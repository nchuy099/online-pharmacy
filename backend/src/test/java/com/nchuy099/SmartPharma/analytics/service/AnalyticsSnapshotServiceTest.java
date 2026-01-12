package com.nchuy099.SmartPharma.analytics.service;

import com.nchuy099.SmartPharma.analytics.entity.AnalyticsDailyOrderMetricsSnapshotEntity;
import com.nchuy099.SmartPharma.analytics.entity.AnalyticsDailyRevenueMetricsSnapshotEntity;
import com.nchuy099.SmartPharma.analytics.repository.AnalyticsDailyConsultationMetricsSnapshotRepository;
import com.nchuy099.SmartPharma.analytics.repository.AnalyticsDailyOrderMetricsSnapshotRepository;
import com.nchuy099.SmartPharma.analytics.repository.AnalyticsDailyProductMetricsSnapshotRepository;
import com.nchuy099.SmartPharma.analytics.repository.AnalyticsDailyRevenueMetricsSnapshotRepository;
import com.nchuy099.SmartPharma.analytics.repository.AnalyticsDailyUserMetricsSnapshotRepository;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.product.repository.ProductRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AnalyticsSnapshotServiceTest {

    private UserRepository userRepository;
    private ProductRepository productRepository;
    private OrderRepository orderRepository;
    private ChatConversationRepository chatConversationRepository;
    private AnalyticsDailyUserMetricsSnapshotRepository userSnapshotRepository;
    private AnalyticsDailyProductMetricsSnapshotRepository productSnapshotRepository;
    private AnalyticsDailyOrderMetricsSnapshotRepository orderSnapshotRepository;
    private AnalyticsDailyRevenueMetricsSnapshotRepository revenueSnapshotRepository;
    private AnalyticsDailyConsultationMetricsSnapshotRepository consultationSnapshotRepository;
    private AnalyticsSnapshotService analyticsSnapshotService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        productRepository = mock(ProductRepository.class);
        orderRepository = mock(OrderRepository.class);
        chatConversationRepository = mock(ChatConversationRepository.class);
        userSnapshotRepository = mock(AnalyticsDailyUserMetricsSnapshotRepository.class);
        productSnapshotRepository = mock(AnalyticsDailyProductMetricsSnapshotRepository.class);
        orderSnapshotRepository = mock(AnalyticsDailyOrderMetricsSnapshotRepository.class);
        revenueSnapshotRepository = mock(AnalyticsDailyRevenueMetricsSnapshotRepository.class);
        consultationSnapshotRepository = mock(AnalyticsDailyConsultationMetricsSnapshotRepository.class);

        analyticsSnapshotService = new AnalyticsSnapshotService(
                userRepository,
                productRepository,
                orderRepository,
                chatConversationRepository,
                userSnapshotRepository,
                productSnapshotRepository,
                orderSnapshotRepository,
                revenueSnapshotRepository,
                consultationSnapshotRepository);
        ReflectionTestUtils.setField(analyticsSnapshotService, "snapshotZoneId", "Asia/Ho_Chi_Minh");
    }

    @Test
    void upsertForDateShouldUseAllOrdersByCreatedAtAndPersistSnapshots() {
        LocalDate date = LocalDate.of(2026, 4, 10);
        Instant start = date.atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
        Instant end = date.plusDays(1).atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();

        when(userRepository.countByCreatedAtBetween(start, end)).thenReturn(5L);
        when(userRepository.countByCreatedAtBefore(end)).thenReturn(50L);
        when(productRepository.countByCreatedAtBetween(start, end)).thenReturn(3L);
        when(productRepository.countByCreatedAtBefore(end)).thenReturn(35L);
        when(productRepository.countByIsActiveTrueAndCreatedAtBefore(end)).thenReturn(30L);
        when(orderRepository.countByCreatedAtBetween(start, end)).thenReturn(7L);
        when(orderRepository.countByCreatedAtBefore(end)).thenReturn(70L);
        when(orderRepository.sumTotalAmountByCreatedAtBetween(start, end)).thenReturn(BigDecimal.valueOf(1200000));
        when(orderRepository.sumTotalAmountByCreatedAtBefore(end)).thenReturn(BigDecimal.valueOf(9800000));
        when(chatConversationRepository.countByCreatedAtBetween(start, end)).thenReturn(12L);
        when(chatConversationRepository.countByCreatedAtBefore(end)).thenReturn(200L);

        when(userSnapshotRepository.findById(date)).thenReturn(Optional.empty());
        when(productSnapshotRepository.findById(date)).thenReturn(Optional.empty());
        when(orderSnapshotRepository.findById(date)).thenReturn(Optional.empty());
        when(revenueSnapshotRepository.findById(date)).thenReturn(Optional.empty());
        when(consultationSnapshotRepository.findById(date)).thenReturn(Optional.empty());

        analyticsSnapshotService.upsertForDate(date, false);

        verify(orderRepository).countByCreatedAtBetween(start, end);
        verify(orderRepository).countByCreatedAtBefore(end);
        verify(orderRepository).sumTotalAmountByCreatedAtBetween(start, end);
        verify(orderRepository).sumTotalAmountByCreatedAtBefore(end);
        verify(orderRepository, never()).countDeliveredByCreatedAtBetween(any(), any());

        ArgumentCaptor<AnalyticsDailyOrderMetricsSnapshotEntity> orderCaptor = ArgumentCaptor
                .forClass(AnalyticsDailyOrderMetricsSnapshotEntity.class);
        verify(orderSnapshotRepository).save(orderCaptor.capture());
        assertEquals(7L, orderCaptor.getValue().getDeliveredOrdersNew());
        assertEquals(70L, orderCaptor.getValue().getDeliveredOrdersTotal());

        ArgumentCaptor<AnalyticsDailyRevenueMetricsSnapshotEntity> revenueCaptor = ArgumentCaptor
                .forClass(AnalyticsDailyRevenueMetricsSnapshotEntity.class);
        verify(revenueSnapshotRepository).save(revenueCaptor.capture());
        assertEquals(BigDecimal.valueOf(1200000), revenueCaptor.getValue().getDeliveredRevenueNew());
        assertEquals(BigDecimal.valueOf(9800000), revenueCaptor.getValue().getDeliveredRevenueTotal());
    }
}
