package com.nchuy099.SmartPharma.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@MappedSuperclass
@FieldDefaults(level = AccessLevel.PRIVATE)
public abstract class AnalyticsDailySnapshotBaseEntity {

    @Id
    @Column(name = "snapshot_date", nullable = false)
    LocalDate snapshotDate;

    @Column(name = "is_final", nullable = false)
    Boolean isFinal;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;
}
