package com.nchuy099.SmartPharma.analytics.repository;

import com.nchuy099.SmartPharma.analytics.entity.AnalyticsDailyRevenueMetricsSnapshotEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AnalyticsDailyRevenueMetricsSnapshotRepository
        extends JpaRepository<AnalyticsDailyRevenueMetricsSnapshotEntity, LocalDate> {

    @Query("""
            SELECT COALESCE(SUM(s.deliveredRevenueNew), 0)
            FROM AnalyticsDailyRevenueMetricsSnapshotEntity s
            WHERE s.snapshotDate BETWEEN :fromDate AND :toDate
            """)
    BigDecimal sumDeliveredRevenueNewBetween(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    List<AnalyticsDailyRevenueMetricsSnapshotEntity> findBySnapshotDateBetweenOrderBySnapshotDate(LocalDate fromDate,
                                                                                                   LocalDate toDate);
}
