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

import java.math.BigDecimal;

@Entity
@Table(name = "analytics_daily_revenue_metrics_snapshot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnalyticsDailyRevenueMetricsSnapshotEntity extends AnalyticsDailySnapshotBaseEntity {

    @Column(name = "delivered_revenue_new", nullable = false)
    BigDecimal deliveredRevenueNew;

    @Column(name = "delivered_revenue_total", nullable = false)
    BigDecimal deliveredRevenueTotal;
}
