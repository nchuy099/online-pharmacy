package com.nchuy099.SmartPharma.order.domain.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.order.domain.entity.OrderItemEntity;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItemEntity, UUID> {
    interface ProductSalesProjection {
        UUID getProductId();
        Long getPurchases();
        BigDecimal getRevenue();
        BigDecimal getCost();
    }

    interface TopSellingProductProjection {
        String getName();
        long getSoldQuantity();
    }

    @Query("""
            SELECT COALESCE(SUM(COALESCE(oi.unitCost, COALESCE(v.averageCost, COALESCE(v.latestImportCost, 0))) * oi.quantity), 0)
            FROM OrderItemEntity oi
            LEFT JOIN oi.variant v
            """)
    BigDecimal sumTotalCostAmount();

    @Query("""
            SELECT COALESCE(SUM(COALESCE(oi.unitCost, COALESCE(v.averageCost, COALESCE(v.latestImportCost, 0))) * oi.quantity), 0)
            FROM OrderItemEntity oi
            JOIN oi.order o
            LEFT JOIN oi.variant v
            WHERE o.createdAt >= :startOfDay AND o.createdAt < :endOfDay
            """)
    BigDecimal sumTotalCostAmountByCreatedAtBetween(@Param("startOfDay") Instant startOfDay,
                                                    @Param("endOfDay") Instant endOfDay);

    @Query("""
            SELECT oi.product.id as productId,
                   COALESCE(SUM(oi.quantity), 0) as purchases,
                   COALESCE(SUM(oi.totalPrice), 0) as revenue,
                   COALESCE(SUM(COALESCE(oi.unitCost, COALESCE(v.averageCost, COALESCE(v.latestImportCost, 0))) * oi.quantity), 0) as cost
            FROM OrderItemEntity oi
            JOIN oi.order o
            LEFT JOIN oi.variant v
            WHERE o.status = com.nchuy099.SmartPharma.order.domain.enums.OrderStatus.DELIVERED
              AND o.deliveredAt >= :startOfDay
              AND o.deliveredAt < :endOfDay
            GROUP BY oi.product.id
            """)
    List<ProductSalesProjection> findProductSalesStatsByDeliveredAtBetween(@Param("startOfDay") Instant startOfDay,
                                                                           @Param("endOfDay") Instant endOfDay);

    @Query("""
            SELECT oi.snapshotProductName as name, COALESCE(SUM(oi.quantity), 0) as soldQuantity
            FROM OrderItemEntity oi
            GROUP BY oi.snapshotProductName
            ORDER BY COALESCE(SUM(oi.quantity), 0) DESC
            """)
    List<TopSellingProductProjection> findTopSellingProducts(Pageable pageable);
}
