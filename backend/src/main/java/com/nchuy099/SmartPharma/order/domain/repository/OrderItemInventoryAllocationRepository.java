package com.nchuy099.SmartPharma.order.domain.repository;

import com.nchuy099.SmartPharma.order.domain.entity.OrderItemInventoryAllocationEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemInventoryAllocationRepository extends JpaRepository<OrderItemInventoryAllocationEntity, UUID> {

    @Query("""
        SELECT a
        FROM OrderItemInventoryAllocationEntity a
        JOIN FETCH a.orderItem oi
        JOIN FETCH a.lot l
        JOIN FETCH l.variant v
        WHERE oi.order.id = :orderId
        ORDER BY oi.id ASC, l.expiryDate ASC, l.receivedAt ASC, l.id ASC
    """)
    List<OrderItemInventoryAllocationEntity> findByOrderId(@Param("orderId") UUID orderId);

    @Query("""
        SELECT a
        FROM OrderItemInventoryAllocationEntity a
        JOIN FETCH a.lot l
        WHERE a.orderItem.id = :orderItemId
        ORDER BY l.expiryDate ASC, l.receivedAt ASC, l.id ASC
    """)
    List<OrderItemInventoryAllocationEntity> findByOrderItemId(@Param("orderItemId") UUID orderItemId);
}
