package com.nchuy099.SmartPharma.analytics.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnalyticsDashboardResponse {
    KpiStats scopeKpi;
    List<TopProduct> topProducts;
    List<TopProduct> tableRows;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KpiStats {
        double revenue;
        double profit;
        double marginPercent;
        long orders;
        long newUsers;
        long totalUsers;
        long activeProducts;
        long soldProducts;
        long purchasingUsers;
        double aov;
        long orderNew;
        long orderCancelled;
        long orderCompleted;
        long consultations;
        long chatbotConsultations;
        long pharmacistConsultations;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopProduct {
        String id;
        String image;
        String name;
        String sku;
        double unitPrice;
        String packageType;
        long views;
        long addToCart;
        long purchases;
        double revenue;
        double profit;
        double conversionRate;
    }
}
