package com.nchuy099.SmartPharma.inventory.repository;

import com.nchuy099.SmartPharma.inventory.entity.InventoryReservationItemEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryReservationItemRepository extends JpaRepository<InventoryReservationItemEntity, UUID> {

    @Query("""
        SELECT i
        FROM InventoryReservationItemEntity i
        JOIN FETCH i.reservation r
        JOIN FETCH i.orderItem oi
        JOIN FETCH i.variant v
        JOIN FETCH i.lot l
        WHERE r.order.id = :orderId
        ORDER BY oi.id ASC, l.expiryDate ASC, l.receivedAt ASC, l.id ASC
    """)
    List<InventoryReservationItemEntity> findByOrderId(@Param("orderId") UUID orderId);
}
