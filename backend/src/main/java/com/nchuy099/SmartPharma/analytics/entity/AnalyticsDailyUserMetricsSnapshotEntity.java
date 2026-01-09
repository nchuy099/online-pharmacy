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
@Table(name = "analytics_daily_user_metrics_snapshot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnalyticsDailyUserMetricsSnapshotEntity extends AnalyticsDailySnapshotBaseEntity {

    @Column(name = "users_new", nullable = false)
    Long usersNew;

    @Column(name = "users_total", nullable = false)
    Long usersTotal;
}
