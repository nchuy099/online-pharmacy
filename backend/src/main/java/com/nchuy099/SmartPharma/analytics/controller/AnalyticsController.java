package com.nchuy099.SmartPharma.analytics.controller;

import com.nchuy099.SmartPharma.analytics.dto.request.AnalyticsQueryRequest;
import com.nchuy099.SmartPharma.analytics.dto.response.AnalyticsDashboardResponse;
import com.nchuy099.SmartPharma.analytics.dto.response.AnalyticsSnapshotRangeResponse;
import com.nchuy099.SmartPharma.analytics.dto.response.AnalyticsSnapshotSummaryResponse;
import com.nchuy099.SmartPharma.analytics.dto.response.AnalyticsSnapshotTimeseriesResponse;
import com.nchuy099.SmartPharma.analytics.service.AnalyticsDashboardService;
import com.nchuy099.SmartPharma.analytics.service.AnalyticsSnapshotQueryService;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.user.enums.RbacPermissions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/admin/analytics")
@Slf4j
@RequiredArgsConstructor
@PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_ANALYTICS)")
public class AnalyticsController {

    private final AnalyticsSnapshotQueryService analyticsSnapshotQueryService;
    private final AnalyticsDashboardService analyticsDashboardService;

    @GetMapping("/summary")
    public AnalyticsSnapshotSummaryResponse getSummary(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Received request to get analytics snapshot summary for date={}", date);
        return analyticsSnapshotQueryService.getSummary(date);
    }

    @GetMapping("/timeseries")
    public AnalyticsSnapshotTimeseriesResponse getTimeseries(
            @RequestParam("metric") String metric,
            @RequestParam("granularity") String granularity,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        AnalyticsQueryRequest.Metric metricValue = parseMetric(metric);
        AnalyticsQueryRequest.Granularity granularityValue = parseGranularity(granularity);
        log.info("Received request to get analytics snapshot timeseries metric={} granularity={} from={} to={}",
                metricValue, granularityValue, from, to);
        return analyticsSnapshotQueryService.getTimeseries(metricValue, granularityValue, from, to);
    }

    @GetMapping("/range")
    public AnalyticsSnapshotRangeResponse getRange(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        log.info("Received request to get analytics snapshot range from={} to={}", from, to);
        return analyticsSnapshotQueryService.getRange(from, to);
    }

    @GetMapping("/dashboard")
    public AnalyticsDashboardResponse getDashboard(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        log.info("Received request to get analytics dashboard from={} to={}", from, to);
        return analyticsDashboardService.getDashboardStats(from, to);
    }

    private AnalyticsQueryRequest.Metric parseMetric(String metric) {
        try {
            return AnalyticsQueryRequest.Metric.valueOf(metric.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid metric. Supported: user, product, order, revenue, consultation");
        }
    }

    private AnalyticsQueryRequest.Granularity parseGranularity(String granularity) {
        try {
            return AnalyticsQueryRequest.Granularity.valueOf(granularity.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid granularity. Supported: day, month, year");
        }
    }
}
