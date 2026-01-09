package com.nchuy099.SmartPharma.analytics.service;

import com.nchuy099.SmartPharma.analytics.dto.request.AnalyticsQueryRequest;
import com.nchuy099.SmartPharma.analytics.dto.response.AnalyticsSnapshotRangeResponse;
import com.nchuy099.SmartPharma.analytics.dto.response.AnalyticsSnapshotSummaryResponse;
import com.nchuy099.SmartPharma.analytics.dto.response.AnalyticsSnapshotTimeseriesPoint;
import com.nchuy099.SmartPharma.analytics.dto.response.AnalyticsSnapshotTimeseriesResponse;
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
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsSnapshotQueryService {

    private final AnalyticsDailyUserMetricsSnapshotRepository userSnapshotRepository;
    private final AnalyticsDailyProductMetricsSnapshotRepository productSnapshotRepository;
    private final AnalyticsDailyOrderMetricsSnapshotRepository orderSnapshotRepository;
    private final AnalyticsDailyRevenueMetricsSnapshotRepository revenueSnapshotRepository;
    private final AnalyticsDailyConsultationMetricsSnapshotRepository consultationSnapshotRepository;

    public AnalyticsSnapshotSummaryResponse getSummary(LocalDate date) {
        AnalyticsDailyUserMetricsSnapshotEntity user = userSnapshotRepository.findById(date)
                .orElseGet(AnalyticsDailyUserMetricsSnapshotEntity::new);
        AnalyticsDailyProductMetricsSnapshotEntity product = productSnapshotRepository.findById(date)
                .orElseGet(AnalyticsDailyProductMetricsSnapshotEntity::new);
        AnalyticsDailyOrderMetricsSnapshotEntity order = orderSnapshotRepository.findById(date)
                .orElseGet(AnalyticsDailyOrderMetricsSnapshotEntity::new);
        AnalyticsDailyRevenueMetricsSnapshotEntity revenue = revenueSnapshotRepository.findById(date)
                .orElseGet(AnalyticsDailyRevenueMetricsSnapshotEntity::new);
        AnalyticsDailyConsultationMetricsSnapshotEntity consultation = consultationSnapshotRepository.findById(date)
                .orElseGet(AnalyticsDailyConsultationMetricsSnapshotEntity::new);

        return AnalyticsSnapshotSummaryResponse.builder()
                .snapshotDate(date)
                .users(AnalyticsSnapshotSummaryResponse.DomainCountMetrics.builder()
                        .newlyAdded(zeroIfNull(user.getUsersNew()))
                        .total(zeroIfNull(user.getUsersTotal()))
                        .build())
                .products(AnalyticsSnapshotSummaryResponse.ProductMetrics.builder()
                        .newlyAdded(zeroIfNull(product.getProductsNew()))
                        .total(zeroIfNull(product.getProductsTotal()))
                        .activeTotal(zeroIfNull(product.getProductsActiveTotal()))
                        .build())
                .orders(AnalyticsSnapshotSummaryResponse.DomainCountMetrics.builder()
                        .newlyAdded(zeroIfNull(order.getDeliveredOrdersNew()))
                        .total(zeroIfNull(order.getDeliveredOrdersTotal()))
                        .build())
                .revenue(AnalyticsSnapshotSummaryResponse.RevenueMetrics.builder()
                        .newlyAdded(zeroIfNull(revenue.getDeliveredRevenueNew()))
                        .total(zeroIfNull(revenue.getDeliveredRevenueTotal()))
                        .build())
                .consultations(AnalyticsSnapshotSummaryResponse.DomainCountMetrics.builder()
                        .newlyAdded(zeroIfNull(consultation.getConsultationsNew()))
                        .total(zeroIfNull(consultation.getConsultationsTotal()))
                        .build())
                .build();
    }

    public AnalyticsSnapshotRangeResponse getRange(LocalDate fromDate, LocalDate toDate) {
        validateDateRange(fromDate, toDate);
        return AnalyticsSnapshotRangeResponse.builder()
                .from(fromDate)
                .to(toDate)
                .deliveredOrders(orderSnapshotRepository.sumDeliveredOrdersNewBetween(fromDate, toDate))
                .deliveredRevenue(zeroIfNull(revenueSnapshotRepository.sumDeliveredRevenueNewBetween(fromDate, toDate)))
                .consultations(consultationSnapshotRepository.sumConsultationsNewBetween(fromDate, toDate))
                .build();
    }

    public AnalyticsSnapshotTimeseriesResponse getTimeseries(AnalyticsQueryRequest.Metric metric,
            AnalyticsQueryRequest.Granularity granularity,
            LocalDate fromDate, LocalDate toDate) {
        validateDateRange(fromDate, toDate);
        List<DailyPoint> dailyPoints = loadDailyPoints(metric, fromDate, toDate);
        List<AnalyticsSnapshotTimeseriesPoint> points = aggregate(dailyPoints, granularity);
        return AnalyticsSnapshotTimeseriesResponse.builder()
                .metric(metric)
                .granularity(granularity)
                .from(fromDate)
                .to(toDate)
                .points(points)
                .build();
    }

    public LocalDate getLatestSnapshotDateOr(LocalDate fallback) {
        return userSnapshotRepository.findAll().stream()
                .map(AnalyticsDailyUserMetricsSnapshotEntity::getSnapshotDate)
                .max(Comparator.naturalOrder())
                .orElse(fallback);
    }

    private List<DailyPoint> loadDailyPoints(AnalyticsQueryRequest.Metric metric, LocalDate fromDate, LocalDate toDate) {
        return switch (metric) {
            case USER -> userSnapshotRepository.findBySnapshotDateBetweenOrderBySnapshotDate(fromDate, toDate).stream()
                    .map(s -> new DailyPoint(
                            s.getSnapshotDate(),
                            BigDecimal.valueOf(zeroIfNull(s.getUsersNew())),
                            BigDecimal.valueOf(zeroIfNull(s.getUsersTotal()))))
                    .toList();
            case PRODUCT ->
                productSnapshotRepository.findBySnapshotDateBetweenOrderBySnapshotDate(fromDate, toDate).stream()
                        .map(s -> new DailyPoint(
                                s.getSnapshotDate(),
                                BigDecimal.valueOf(zeroIfNull(s.getProductsNew())),
                                BigDecimal.valueOf(zeroIfNull(s.getProductsTotal()))))
                        .toList();
            case ORDER -> orderSnapshotRepository.findBySnapshotDateBetweenOrderBySnapshotDate(fromDate, toDate).stream()
                    .map(s -> new DailyPoint(
                            s.getSnapshotDate(),
                            BigDecimal.valueOf(zeroIfNull(s.getDeliveredOrdersNew())),
                            BigDecimal.valueOf(zeroIfNull(s.getDeliveredOrdersTotal()))))
                    .toList();
            case REVENUE -> revenueSnapshotRepository.findBySnapshotDateBetweenOrderBySnapshotDate(fromDate, toDate).stream()
                    .map(s -> new DailyPoint(
                            s.getSnapshotDate(),
                            zeroIfNull(s.getDeliveredRevenueNew()),
                            zeroIfNull(s.getDeliveredRevenueTotal())))
                    .toList();
            case CONSULTATION ->
                consultationSnapshotRepository.findBySnapshotDateBetweenOrderBySnapshotDate(fromDate, toDate).stream()
                        .map(s -> new DailyPoint(
                                s.getSnapshotDate(),
                                BigDecimal.valueOf(zeroIfNull(s.getConsultationsNew())),
                                BigDecimal.valueOf(zeroIfNull(s.getConsultationsTotal()))))
                        .toList();
        };
    }

    private List<AnalyticsSnapshotTimeseriesPoint> aggregate(List<DailyPoint> dailyPoints,
            AnalyticsQueryRequest.Granularity granularity) {
        if (granularity == AnalyticsQueryRequest.Granularity.DAY) {
            return dailyPoints.stream()
                    .map(point -> AnalyticsSnapshotTimeseriesPoint.builder()
                            .period(point.date().toString())
                            .newlyAdded(point.newlyAdded())
                            .total(point.total())
                            .build())
                    .toList();
        }

        Map<String, List<DailyPoint>> grouped = new LinkedHashMap<>();
        for (DailyPoint point : dailyPoints) {
            String key = granularity == AnalyticsQueryRequest.Granularity.MONTH
                    ? YearMonth.from(point.date()).toString()
                    : String.valueOf(point.date().getYear());
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(point);
        }

        List<AnalyticsSnapshotTimeseriesPoint> points = new ArrayList<>();
        for (Map.Entry<String, List<DailyPoint>> entry : grouped.entrySet()) {
            BigDecimal newValue = entry.getValue().stream()
                    .map(DailyPoint::newlyAdded)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalValue = entry.getValue().stream()
                    .max(Comparator.comparing(DailyPoint::date))
                    .map(DailyPoint::total)
                    .orElse(BigDecimal.ZERO);

            points.add(AnalyticsSnapshotTimeseriesPoint.builder()
                    .period(entry.getKey())
                    .newlyAdded(newValue)
                    .total(totalValue)
                    .build());
        }

        return points;
    }

    private void validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null || toDate == null || fromDate.isAfter(toDate)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid date range. Expected from <= to.");
        }
    }

    private long zeroIfNull(Long value) {
        return value == null ? 0L : value;
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private record DailyPoint(LocalDate date, BigDecimal newlyAdded, BigDecimal total) {
    }
}
