package com.nchuy099.SmartPharma.analytics.job;

import com.nchuy099.SmartPharma.analytics.service.AnalyticsSnapshotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnalyticsSnapshotScheduler {

    private final AnalyticsSnapshotService analyticsSnapshotService;

    @Value("${analytics.snapshot.enabled:true}")
    private boolean enabled;

    @Value("${analytics.snapshot.zone-id:Asia/Ho_Chi_Minh}")
    private String zoneId;

    @Scheduled(cron = "${analytics.snapshot.current-day-cron:0 */5 * * * *}")
    public void updateCurrentDaySnapshot() {
        if (!enabled) {
            return;
        }

        LocalDate today = LocalDate.now(ZoneId.of(zoneId));
        log.debug("Running analytics current-day snapshot update for {}", today);
        analyticsSnapshotService.upsertForDate(today, false);
    }

    @Scheduled(cron = "${analytics.snapshot.finalize-cron:0 5 0 * * *}")
    public void finalizeYesterdaySnapshot() {
        if (!enabled) {
            return;
        }

        LocalDate yesterday = LocalDate.now(ZoneId.of(zoneId)).minusDays(1);
        log.info("Finalizing analytics snapshot for {}", yesterday);
        analyticsSnapshotService.upsertForDate(yesterday, true);
    }
}
