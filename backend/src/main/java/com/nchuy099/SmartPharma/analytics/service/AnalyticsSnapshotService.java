package com.nchuy099.SmartPharma.analytics.service;

import com.nchuy099.SmartPharma.analytics.entity.AnalyticsDailyConsultationMetricsSnapshotEntity;
import com.nchuy099.SmartPharma.analytics.entity.AnalyticsDailyOrderMetricsSnapshotEntity;
import com.nchuy099.SmartPharma.analytics.entity.AnalyticsDailyProductMetricsSnapshotEntity;
import com.nchuy099.SmartPharma.analytics.entity.AnalyticsDailyRevenueMetricsSnapshotEntity;
import com.nchuy099.SmartPharma.analytics.entity.AnalyticsDailyUserMetricsSnapshotEntity;
import com.nchuy099.SmartPharma.analytics.repository.AnalyticsDailyConsultationMetricsSnapshotRepository;
import com.nchuy099.SmartPharma.analytics.repository.AnalyticsDailyOrderMetricsSnapshotRepository;
import com.nchuy099.SmartPharma.analytics.repository.AnalyticsDailyProductMetricsSnapshotRepository;
import com.nchuy099.SmartPharma.analytics.repository.AnalyticsDailyRevenueMetricsSnapshotRepository;
import com.nchuy099.SmartPharma.analytics.repository.AnalyticsDailyUserMetricsSnapshotRepository;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.product.repository.ProductRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsSnapshotService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ChatConversationRepository chatConversationRepository;

    private final AnalyticsDailyUserMetricsSnapshotRepository userSnapshotRepository;
    private final AnalyticsDailyProductMetricsSnapshotRepository productSnapshotRepository;
    private final AnalyticsDailyOrderMetricsSnapshotRepository orderSnapshotRepository;
    private final AnalyticsDailyRevenueMetricsSnapshotRepository revenueSnapshotRepository;
    private final AnalyticsDailyConsultationMetricsSnapshotRepository consultationSnapshotRepository;

    @Value("${analytics.snapshot.zone-id:Asia/Ho_Chi_Minh}")
    private String snapshotZoneId;

    @Transactional
    public void upsertForDate(LocalDate snapshotDate, boolean isFinal) {
        ZoneId zoneId = ZoneId.of(snapshotZoneId);
        Instant start = snapshotDate.atStartOfDay(zoneId).toInstant();
        Instant endExclusive = snapshotDate.plusDays(1).atStartOfDay(zoneId).toInstant();

        long usersNew = userRepository.countByCreatedAtBetween(start, endExclusive);
        long usersTotal = userRepository.countByCreatedAtBefore(endExclusive);

        long productsNew = productRepository.countByCreatedAtBetween(start, endExclusive);
        long productsTotal = productRepository.countByCreatedAtBefore(endExclusive);
        long productsActiveTotal = productRepository.countByIsActiveTrueAndCreatedAtBefore(endExclusive);

        long ordersNew = orderRepository.countByCreatedAtBetween(start, endExclusive);
        long ordersTotal = orderRepository.countByCreatedAtBefore(endExclusive);

        BigDecimal revenueNew = zeroIfNull(orderRepository.sumTotalAmountByCreatedAtBetween(start, endExclusive));
        BigDecimal revenueTotal = zeroIfNull(orderRepository.sumTotalAmountByCreatedAtBefore(endExclusive));

        long consultationsNew = chatConversationRepository.countByCreatedAtBetween(start, endExclusive);
        long consultationsTotal = chatConversationRepository.countByCreatedAtBefore(endExclusive);

        upsertUserSnapshot(snapshotDate, isFinal, usersNew, usersTotal);
        upsertProductSnapshot(snapshotDate, isFinal, productsNew, productsTotal, productsActiveTotal);
        upsertOrderSnapshot(snapshotDate, isFinal, ordersNew, ordersTotal);
        upsertRevenueSnapshot(snapshotDate, isFinal, revenueNew, revenueTotal);
        upsertConsultationSnapshot(snapshotDate, isFinal, consultationsNew, consultationsTotal);

        log.info(
                "Upserted analytics snapshot for date={} isFinal={} usersNew={} productsNew={} ordersNew={} revenueNew={} consultationsNew={}",
                snapshotDate, isFinal, usersNew, productsNew, ordersNew, revenueNew, consultationsNew);
    }

    private void upsertUserSnapshot(LocalDate snapshotDate, boolean isFinal, long usersNew, long usersTotal) {
        AnalyticsDailyUserMetricsSnapshotEntity entity = userSnapshotRepository.findById(snapshotDate)
                .orElseGet(AnalyticsDailyUserMetricsSnapshotEntity::new);
        entity.setSnapshotDate(snapshotDate);
        entity.setIsFinal(isFinal);
        entity.setUsersNew(usersNew);
        entity.setUsersTotal(usersTotal);
        userSnapshotRepository.save(entity);
    }

    private void upsertProductSnapshot(LocalDate snapshotDate, boolean isFinal, long productsNew, long productsTotal,
            long productsActiveTotal) {
        AnalyticsDailyProductMetricsSnapshotEntity entity = productSnapshotRepository.findById(snapshotDate)
                .orElseGet(AnalyticsDailyProductMetricsSnapshotEntity::new);
        entity.setSnapshotDate(snapshotDate);
        entity.setIsFinal(isFinal);
        entity.setProductsNew(productsNew);
        entity.setProductsTotal(productsTotal);
        entity.setProductsActiveTotal(productsActiveTotal);
        productSnapshotRepository.save(entity);
    }

    private void upsertOrderSnapshot(LocalDate snapshotDate, boolean isFinal, long deliveredOrdersNew,
            long deliveredOrdersTotal) {
        AnalyticsDailyOrderMetricsSnapshotEntity entity = orderSnapshotRepository.findById(snapshotDate)
                .orElseGet(AnalyticsDailyOrderMetricsSnapshotEntity::new);
        entity.setSnapshotDate(snapshotDate);
        entity.setIsFinal(isFinal);
        entity.setDeliveredOrdersNew(deliveredOrdersNew);
        entity.setDeliveredOrdersTotal(deliveredOrdersTotal);
        orderSnapshotRepository.save(entity);
    }

    private void upsertRevenueSnapshot(LocalDate snapshotDate, boolean isFinal, BigDecimal deliveredRevenueNew,
            BigDecimal deliveredRevenueTotal) {
        AnalyticsDailyRevenueMetricsSnapshotEntity entity = revenueSnapshotRepository.findById(snapshotDate)
                .orElseGet(AnalyticsDailyRevenueMetricsSnapshotEntity::new);
        entity.setSnapshotDate(snapshotDate);
        entity.setIsFinal(isFinal);
        entity.setDeliveredRevenueNew(deliveredRevenueNew);
        entity.setDeliveredRevenueTotal(deliveredRevenueTotal);
        revenueSnapshotRepository.save(entity);
    }

    private void upsertConsultationSnapshot(LocalDate snapshotDate, boolean isFinal, long consultationsNew,
            long consultationsTotal) {
        AnalyticsDailyConsultationMetricsSnapshotEntity entity = consultationSnapshotRepository.findById(snapshotDate)
                .orElseGet(AnalyticsDailyConsultationMetricsSnapshotEntity::new);
        entity.setSnapshotDate(snapshotDate);
        entity.setIsFinal(isFinal);
        entity.setConsultationsNew(consultationsNew);
        entity.setConsultationsTotal(consultationsTotal);
        consultationSnapshotRepository.save(entity);
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
