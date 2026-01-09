package com.nchuy099.SmartPharma.analytics.repository;

import com.nchuy099.SmartPharma.analytics.entity.AnalyticsDailyOrderMetricsSnapshotEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AnalyticsDailyOrderMetricsSnapshotRepository
        extends JpaRepository<AnalyticsDailyOrderMetricsSnapshotEntity, LocalDate> {

    @Query("""
            SELECT COALESCE(SUM(s.deliveredOrdersNew), 0)
            FROM AnalyticsDailyOrderMetricsSnapshotEntity s
            WHERE s.snapshotDate BETWEEN :fromDate AND :toDate
            """)
    long sumDeliveredOrdersNewBetween(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    List<AnalyticsDailyOrderMetricsSnapshotEntity> findBySnapshotDateBetweenOrderBySnapshotDate(LocalDate fromDate,
                                                                                                 LocalDate toDate);
}
