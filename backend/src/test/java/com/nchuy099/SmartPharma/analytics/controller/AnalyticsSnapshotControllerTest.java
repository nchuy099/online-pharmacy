package com.nchuy099.SmartPharma.analytics.controller;

import com.nchuy099.SmartPharma.analytics.dto.request.AnalyticsQueryRequest;
import com.nchuy099.SmartPharma.analytics.dto.response.AnalyticsDashboardResponse;
import com.nchuy099.SmartPharma.analytics.dto.response.AnalyticsSnapshotTimeseriesResponse;
import com.nchuy099.SmartPharma.analytics.service.AnalyticsDashboardService;
import com.nchuy099.SmartPharma.analytics.service.AnalyticsSnapshotQueryService;
import com.nchuy099.SmartPharma.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AnalyticsSnapshotControllerTest {

    private AnalyticsSnapshotQueryService queryService;
    private AnalyticsDashboardService dashboardService;
    private AnalyticsController analyticsController;

    @BeforeEach
    void setUp() {
        queryService = mock(AnalyticsSnapshotQueryService.class);
        dashboardService = mock(AnalyticsDashboardService.class);
        analyticsController = new AnalyticsController(queryService, dashboardService);
    }

    @Test
    void getSnapshotTimeseriesShouldParseLowercaseQueryParams() {
        LocalDate from = LocalDate.of(2026, 4, 1);
        LocalDate to = LocalDate.of(2026, 4, 10);
        AnalyticsSnapshotTimeseriesResponse response = AnalyticsSnapshotTimeseriesResponse.builder()
                .metric(AnalyticsQueryRequest.Metric.USER)
                .granularity(AnalyticsQueryRequest.Granularity.DAY)
                .from(from)
                .to(to)
                .points(List.of())
                .build();
        when(queryService.getTimeseries(eq(AnalyticsQueryRequest.Metric.USER),
                eq(AnalyticsQueryRequest.Granularity.DAY), eq(from), eq(to)))
                .thenReturn(response);

        analyticsController.getTimeseries("user", "day", from, to);

        verify(queryService).getTimeseries(AnalyticsQueryRequest.Metric.USER, AnalyticsQueryRequest.Granularity.DAY, from,
                to);
    }

    @Test
    void getSnapshotTimeseriesShouldThrowOnInvalidMetric() {
        LocalDate from = LocalDate.of(2026, 4, 1);
        LocalDate to = LocalDate.of(2026, 4, 10);
        assertThrows(AppException.class,
                () -> analyticsController.getTimeseries("invalid", "day", from, to));
    }

    @Test
    void getSnapshotTimeseriesShouldThrowOnInvalidGranularity() {
        LocalDate from = LocalDate.of(2026, 4, 1);
        LocalDate to = LocalDate.of(2026, 4, 10);
        assertThrows(AppException.class,
                () -> analyticsController.getTimeseries("user", "hour", from, to));
    }

    @Test
    void getDashboardShouldDelegateToDashboardService() {
        LocalDate from = LocalDate.of(2026, 4, 1);
        LocalDate to = LocalDate.of(2026, 4, 10);
        AnalyticsDashboardResponse response = AnalyticsDashboardResponse.builder().build();
        when(dashboardService.getDashboardStats(eq(from), eq(to))).thenReturn(response);

        analyticsController.getDashboard(from, to);

        verify(dashboardService).getDashboardStats(from, to);
    }
}
