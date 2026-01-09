package com.nchuy099.SmartPharma.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "analytics_daily_consultation_metrics_snapshot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnalyticsDailyConsultationMetricsSnapshotEntity extends AnalyticsDailySnapshotBaseEntity {

    @Column(name = "consultations_new", nullable = false)
    Long consultationsNew;

    @Column(name = "consultations_total", nullable = false)
    Long consultationsTotal;
}
