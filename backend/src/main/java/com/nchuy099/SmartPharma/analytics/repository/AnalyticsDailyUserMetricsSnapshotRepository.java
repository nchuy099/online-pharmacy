package com.nchuy099.SmartPharma.analytics.repository;

import com.nchuy099.SmartPharma.analytics.entity.AnalyticsDailyUserMetricsSnapshotEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AnalyticsDailyUserMetricsSnapshotRepository
        extends JpaRepository<AnalyticsDailyUserMetricsSnapshotEntity, LocalDate> {

    @Query("""
            SELECT COALESCE(SUM(s.usersNew), 0)
            FROM AnalyticsDailyUserMetricsSnapshotEntity s
            WHERE s.snapshotDate BETWEEN :fromDate AND :toDate
            """)
    long sumUsersNewBetween(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    @Query(value = """
            SELECT to_char(date_trunc('month', snapshot_date::timestamp), 'YYYY-MM') AS periodLabel,
                   COALESCE(SUM(users_new), 0) AS newValue,
                   COALESCE(MAX(users_total), 0) AS totalValue
            FROM analytics_daily_user_metrics_snapshot
            WHERE snapshot_date BETWEEN :fromDate AND :toDate
            GROUP BY date_trunc('month', snapshot_date::timestamp)
            ORDER BY date_trunc('month', snapshot_date::timestamp)
            """, nativeQuery = true)
    List<SeriesProjection> aggregateByMonth(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    @Query(value = """
            SELECT to_char(date_trunc('year', snapshot_date::timestamp), 'YYYY') AS periodLabel,
                   COALESCE(SUM(users_new), 0) AS newValue,
                   COALESCE(MAX(users_total), 0) AS totalValue
            FROM analytics_daily_user_metrics_snapshot
            WHERE snapshot_date BETWEEN :fromDate AND :toDate
            GROUP BY date_trunc('year', snapshot_date::timestamp)
            ORDER BY date_trunc('year', snapshot_date::timestamp)
            """, nativeQuery = true)
    List<SeriesProjection> aggregateByYear(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    List<AnalyticsDailyUserMetricsSnapshotEntity> findBySnapshotDateBetweenOrderBySnapshotDate(LocalDate fromDate,
                                                                                                LocalDate toDate);

    interface SeriesProjection {
        String getPeriodLabel();

        Long getNewValue();

        Long getTotalValue();
    }
}
