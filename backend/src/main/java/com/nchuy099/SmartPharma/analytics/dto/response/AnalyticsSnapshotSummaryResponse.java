package com.nchuy099.SmartPharma.analytics.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnalyticsSnapshotSummaryResponse {
    LocalDate snapshotDate;
    DomainCountMetrics users;
    ProductMetrics products;
    DomainCountMetrics orders;
    RevenueMetrics revenue;
    DomainCountMetrics consultations;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DomainCountMetrics {
        long newlyAdded;
        long total;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductMetrics {
        long newlyAdded;
        long total;
        long activeTotal;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenueMetrics {
        BigDecimal newlyAdded;
        BigDecimal total;
    }
}
