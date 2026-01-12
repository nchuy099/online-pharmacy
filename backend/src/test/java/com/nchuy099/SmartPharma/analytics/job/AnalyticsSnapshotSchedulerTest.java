package com.nchuy099.SmartPharma.analytics.job;

import com.nchuy099.SmartPharma.analytics.service.AnalyticsSnapshotService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.ZoneId;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class AnalyticsSnapshotSchedulerTest {

    private AnalyticsSnapshotService analyticsSnapshotService;
    private AnalyticsSnapshotScheduler analyticsSnapshotScheduler;

    @BeforeEach
    void setUp() {
        analyticsSnapshotService = mock(AnalyticsSnapshotService.class);
        analyticsSnapshotScheduler = new AnalyticsSnapshotScheduler(analyticsSnapshotService);
        ReflectionTestUtils.setField(analyticsSnapshotScheduler, "zoneId", "Asia/Ho_Chi_Minh");
    }

    @Test
    void updateCurrentDaySnapshotShouldCallUpsertWithTodayAndNonFinal() {
        ReflectionTestUtils.setField(analyticsSnapshotScheduler, "enabled", true);
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));

        analyticsSnapshotScheduler.updateCurrentDaySnapshot();

        verify(analyticsSnapshotService).upsertForDate(today, false);
    }

    @Test
    void finalizeYesterdaySnapshotShouldCallUpsertWithYesterdayAndFinal() {
        ReflectionTestUtils.setField(analyticsSnapshotScheduler, "enabled", true);
        LocalDate yesterday = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).minusDays(1);

        analyticsSnapshotScheduler.finalizeYesterdaySnapshot();

        verify(analyticsSnapshotService).upsertForDate(yesterday, true);
    }

    @Test
    void schedulerShouldNoOpWhenDisabled() {
        ReflectionTestUtils.setField(analyticsSnapshotScheduler, "enabled", false);

        analyticsSnapshotScheduler.updateCurrentDaySnapshot();
        analyticsSnapshotScheduler.finalizeYesterdaySnapshot();

        verifyNoInteractions(analyticsSnapshotService);
    }
}
