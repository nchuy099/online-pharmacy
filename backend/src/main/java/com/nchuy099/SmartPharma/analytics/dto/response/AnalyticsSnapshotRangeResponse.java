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
public class AnalyticsSnapshotRangeResponse {
    LocalDate from;
    LocalDate to;
    long deliveredOrders;
    BigDecimal deliveredRevenue;
    long consultations;
}
