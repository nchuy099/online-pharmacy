package com.nchuy099.SmartPharma.analytics.repository;

import com.nchuy099.SmartPharma.analytics.entity.AnalyticsDailyConsultationMetricsSnapshotEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AnalyticsDailyConsultationMetricsSnapshotRepository
        extends JpaRepository<AnalyticsDailyConsultationMetricsSnapshotEntity, LocalDate> {

    @Query("""
            SELECT COALESCE(SUM(s.consultationsNew), 0)
            FROM AnalyticsDailyConsultationMetricsSnapshotEntity s
            WHERE s.snapshotDate BETWEEN :fromDate AND :toDate
            """)
    long sumConsultationsNewBetween(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    List<AnalyticsDailyConsultationMetricsSnapshotEntity> findBySnapshotDateBetweenOrderBySnapshotDate(LocalDate fromDate,
                                                                                                        LocalDate toDate);
}
