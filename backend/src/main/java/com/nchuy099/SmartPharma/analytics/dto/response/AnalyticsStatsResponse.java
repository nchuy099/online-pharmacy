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
public class AnalyticsStatsResponse {

    BusinessStats business;
    OrderStats orders;
    ProductStats products;
    UserStats users;
    ConsultationStats consultations;

    @Getter
    @Setter
    @Builder
    public static class BusinessStats {
        double totalRevenue;
        double totalProfit;
        long totalOrders;
        double averageOrderValue;
        double todayRevenue;
        double todayProfit;
        long todayOrders;
        double todayAov;
    }

    @Getter
    @Setter
    @Builder
    public static class OrderStats {
        long pendingOrders;
        long shippingOrders;
        long completedOrders;
        long cancelledOrders;
    }

    @Getter
    @Setter
    @Builder
    public static class ProductStats {
        long totalProducts;
        List<TopProduct> topSellingProducts;
        long lowStockCount;
        List<LowStockProduct> lowStockProducts;
    }

    @Getter
    @Setter
    @Builder
    public static class TopProduct {
        String name;
        long soldQuantity;
    }

    @Getter
    @Setter
    @Builder
    public static class LowStockProduct {
        String name;
        long remainingQuantity;
    }

    @Getter
    @Setter
    @Builder
    public static class UserStats {
        long totalUsers;
        long newUsersToday;
        long totalPharmacists;
        long totalCustomers;
        long totalStaff;
        long totalSuperAdmins;
    }

    @Getter
    @Setter
    @Builder
    public static class ConsultationStats {
        long totalQuestions;
        long pharmacistConsultations;
        long chatbotConsultations;
    }
}
