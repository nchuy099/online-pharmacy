package com.nchuy099.SmartPharma.analytics.dto.response;

import com.nchuy099.SmartPharma.analytics.dto.request.AnalyticsQueryRequest;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnalyticsSnapshotTimeseriesResponse {
    AnalyticsQueryRequest.Metric metric;
    AnalyticsQueryRequest.Granularity granularity;
    LocalDate from;
    LocalDate to;
    List<AnalyticsSnapshotTimeseriesPoint> points;
}
