package com.nchuy099.SmartPharma.inventory.repository;

import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryReservationStatus;
import com.nchuy099.SmartPharma.inventory.entity.InventoryReservationEntity;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

@Repository
public interface InventoryReservationRepository extends JpaRepository<InventoryReservationEntity, UUID> {

    @Query("""
        SELECT r
        FROM InventoryReservationEntity r
        JOIN FETCH r.order o
        WHERE o.id = :orderId
    """)
    Optional<InventoryReservationEntity> findByOrderId(@Param("orderId") UUID orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT r
        FROM InventoryReservationEntity r
        JOIN FETCH r.order o
        WHERE r.id = :id
    """)
    Optional<InventoryReservationEntity> findByIdForUpdate(@Param("id") UUID id);

    @Query("""
        SELECT r.id
        FROM InventoryReservationEntity r
        JOIN r.order o
        WHERE r.status = :status
          AND r.expiresAt IS NOT NULL
          AND r.expiresAt < :now
          AND o.status IN (
              com.nchuy099.SmartPharma.order.domain.enums.OrderStatus.PENDING,
              com.nchuy099.SmartPharma.order.domain.enums.OrderStatus.PENDING_PAYMENT
          )
        ORDER BY r.expiresAt ASC
    """)
    List<UUID> findExpiredReservedIds(
            @Param("status") InventoryReservationStatus status,
            @Param("now") Instant now);
}
