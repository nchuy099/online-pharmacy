package com.nchuy099.SmartPharma.analytics.dto.request;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnalyticsQueryRequest {
    Metric metric;
    Granularity granularity;
    LocalDate from;
    LocalDate to;

    public enum Metric {
        USER,
        PRODUCT,
        ORDER,
        REVENUE,
        CONSULTATION
    }

    public enum Granularity {
        DAY,
        MONTH,
        YEAR
    }
}
