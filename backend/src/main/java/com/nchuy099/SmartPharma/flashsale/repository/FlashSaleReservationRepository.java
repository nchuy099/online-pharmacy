package com.nchuy099.SmartPharma.flashsale.repository;

import java.util.Collection;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleReservationStatus;
import com.nchuy099.SmartPharma.flashsale.entity.FlashSaleReservationEntity;

public interface FlashSaleReservationRepository extends JpaRepository<FlashSaleReservationEntity, UUID> {

    Optional<FlashSaleReservationEntity> findByReservationToken(UUID reservationToken);

    Optional<FlashSaleReservationEntity> findByReservationTokenAndUserId(UUID reservationToken, UUID userId);

    @Query("""
            select coalesce(sum(r.quantity), 0)
            from FlashSaleReservationEntity r
            where r.item.id = :itemId
              and r.status in :statuses
            """)
    Long sumQuantityByItemIdAndStatusIn(
            @Param("itemId") UUID itemId,
            @Param("statuses") Collection<FlashSaleReservationStatus> statuses);

    @Query("""
            select r from FlashSaleReservationEntity r
            join fetch r.item i
            join fetch i.variant v
            join fetch v.product p
            where r.status = :status and r.expiresAt < :now
            """)
    java.util.List<FlashSaleReservationEntity> findExpiredReservations(
            @Param("status") FlashSaleReservationStatus status,
            @Param("now") Instant now);
}
