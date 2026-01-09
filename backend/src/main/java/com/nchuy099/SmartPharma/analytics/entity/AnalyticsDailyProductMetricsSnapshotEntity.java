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
@Table(name = "analytics_daily_product_metrics_snapshot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnalyticsDailyProductMetricsSnapshotEntity extends AnalyticsDailySnapshotBaseEntity {

    @Column(name = "products_new", nullable = false)
    Long productsNew;

    @Column(name = "products_total", nullable = false)
    Long productsTotal;

    @Column(name = "products_active_total", nullable = false)
    Long productsActiveTotal;
}
