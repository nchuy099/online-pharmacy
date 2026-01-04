package com.nchuy099.SmartPharma.event.repository;

import com.nchuy099.SmartPharma.event.entity.EventEntity;
import com.nchuy099.SmartPharma.event.enums.EventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<EventEntity, UUID> {
    interface ProductEventCountProjection {
        UUID getProductId();
        Long getTotal();
    }

    @Query("""
            SELECT e.itemId as productId, COUNT(e) as total
            FROM EventEntity e
            WHERE e.createdAt >= :startOfDay
              AND e.createdAt < :endExclusive
              AND e.eventType = :eventType
              AND e.itemId IS NOT NULL
            GROUP BY e.itemId
            ORDER BY COUNT(e) DESC
            """)
    List<ProductEventCountProjection> findTopProductEventCountsByTypeBetween(
            @Param("eventType") EventType eventType,
            @Param("startOfDay") Instant startOfDay,
            @Param("endExclusive") Instant endExclusive,
            Pageable pageable);

    @Query("""
            SELECT e.itemId as productId, COUNT(e) as total
            FROM EventEntity e
            WHERE e.createdAt >= :startOfDay
              AND e.createdAt < :endExclusive
              AND e.eventType = :eventType
              AND e.itemId IN :productIds
            GROUP BY e.itemId
            """)
    List<ProductEventCountProjection> countProductEventCountsByTypeAndProductIdsBetween(
            @Param("eventType") EventType eventType,
            @Param("startOfDay") Instant startOfDay,
            @Param("endExclusive") Instant endExclusive,
            @Param("productIds") List<UUID> productIds);
}
