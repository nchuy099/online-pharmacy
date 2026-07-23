package com.nchuy099.SmartPharma.order.domain.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;

import jakarta.persistence.LockModeType;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {
    @Query("""
            Select o from OrderEntity o
            join fetch o.items oi
            left join fetch oi.variant v
            left join fetch v.inventory
            left join fetch oi.product
            left join fetch oi.review
            left join fetch o.payment
            where o.id = :id
            and o.user.id = :userId
                """)
    Optional<OrderEntity> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    Page<OrderEntity> findByUserId(UUID userId, Pageable pageable);

    @Query(value = """
            select o.id
            from OrderEntity o
            where (:search is null or :search = '' or lower(o.orderCode) like lower(concat('%', :search, '%')))
              and (:status is null or o.status = :status)
            order by o.createdAt desc, o.id desc
            """, countQuery = """
            select count(o)
            from OrderEntity o
            where (:search is null or :search = '' or lower(o.orderCode) like lower(concat('%', :search, '%')))
              and (:status is null or o.status = :status)
            """)
    Page<UUID> findAdminOrderIds(@Param("search") String search,
                                 @Param("status") OrderStatus status,
                                 Pageable pageable);

    @Query("""
            select o
            from OrderEntity o
            where (:search is null or :search = '' or lower(o.orderCode) like lower(concat('%', :search, '%')))
              and (:status is null or o.status = :status)
            order by o.createdAt desc, o.id desc
            """)
    Page<OrderEntity> findAdminOrders(@Param("search") String search,
                                      @Param("status") OrderStatus status,
                                      Pageable pageable);

    @Query("""
                select o.id from OrderEntity o
                where o.user.id = :userId
                and (
                    o.createdAt < :createdAt
                    or (o.createdAt = :createdAt and o.id < :id)
                )
                order by o.createdAt desc, o.id desc
            """)
    List<UUID> findOrderIdsByUserId(@Param("userId") UUID userId,
            @Param("createdAt") Instant createdAt,
            @Param("id") UUID id,
            Pageable pageable);

    @Query("""
                select distinct o from OrderEntity o
                left join fetch o.items item
                left join fetch item.variant v
                left join fetch v.inventory
                left join fetch item.product
                left join fetch item.review
                left join fetch o.payment
                where o.id in :ids
                order by o.createdAt desc, o.id desc
            """)
    List<OrderEntity> findAllWithItemsAndPayment(@Param("ids") List<UUID> ids);

    Optional<OrderEntity> findByOrderCode(String orderCode);

    @Query("""
            select o from OrderEntity o
            join fetch o.user
            left join fetch o.payment
            where o.id = :id
            """)
    Optional<OrderEntity> findByIdWithUserForNotification(@Param("id") UUID id);

    @Query("""
            select distinct o from OrderEntity o
            left join fetch o.items item
            left join fetch item.variant v
            left join fetch v.inventory
            left join fetch item.product
            left join fetch item.review
            left join fetch o.payment
            where o.user.id = :userId
              and o.idempotencyKey = :idempotencyKey
            """)
    Optional<OrderEntity> findByUserIdAndIdempotencyKey(@Param("userId") UUID userId,
                                                        @Param("idempotencyKey") String idempotencyKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select o from OrderEntity o
            left join fetch o.payment
            where o.id = :id
            """)
    Optional<OrderEntity> findByIdForUpdate(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select o from OrderEntity o
            left join fetch o.payment
            where o.orderCode = :orderCode
            """)
    Optional<OrderEntity> findByOrderCodeForUpdate(@Param("orderCode") String orderCode);

    @Query("""
            select o.id
            from OrderEntity o
            where o.status = :status
              and o.createdAt <= :cutoff
            order by o.createdAt asc, o.id asc
            """)
    List<UUID> findIdsByStatusAndCreatedAtBefore(@Param("status") OrderStatus status,
                                                 @Param("cutoff") Instant cutoff);

    @Query("""
            select o from OrderEntity o
            join fetch o.items item
            left join fetch item.variant v
            left join fetch v.inventory
            left join fetch item.product
            left join fetch item.review
            left join fetch o.payment
            where o.ghnOrderCode = :ghnOrderCode
    """)
    Optional<OrderEntity> findByGhnOrderCode(@Param("ghnOrderCode") String ghnOrderCode);

    long count();

    long countByStatus(com.nchuy099.SmartPharma.order.domain.enums.OrderStatus status);

    @Query("SELECT COUNT(o) FROM OrderEntity o WHERE o.createdAt >= :startOfDay AND o.createdAt < :endOfDay")
    long countByCreatedAtBetween(@Param("startOfDay") Instant startOfDay, @Param("endOfDay") Instant endOfDay);

    @Query("SELECT COUNT(o) FROM OrderEntity o WHERE o.createdAt < :endExclusive")
    long countByCreatedAtBefore(@Param("endExclusive") Instant endExclusive);

    @Query("SELECT SUM(o.finalAmount) FROM OrderEntity o")
    java.math.BigDecimal sumTotalAmount();

    @Query("SELECT SUM(o.finalAmount) FROM OrderEntity o WHERE o.createdAt >= :startOfDay AND o.createdAt < :endOfDay")
    java.math.BigDecimal sumTotalAmountByCreatedAtBetween(@Param("startOfDay") Instant startOfDay,
            @Param("endOfDay") Instant endOfDay);

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM OrderEntity o WHERE o.createdAt < :endExclusive")
    BigDecimal sumTotalAmountByCreatedAtBefore(@Param("endExclusive") Instant endExclusive);

    @Query("""
            SELECT COUNT(o)
            FROM OrderEntity o
            WHERE o.status = com.nchuy099.SmartPharma.order.domain.enums.OrderStatus.DELIVERED
              AND o.createdAt >= :startOfDay
              AND o.createdAt < :endOfDay
            """)
    long countDeliveredByCreatedAtBetween(@Param("startOfDay") Instant startOfDay, @Param("endOfDay") Instant endOfDay);

    @Query("""
            SELECT COUNT(o)
            FROM OrderEntity o
            WHERE o.status = com.nchuy099.SmartPharma.order.domain.enums.OrderStatus.DELIVERED
              AND o.createdAt < :endExclusive
            """)
    long countDeliveredByCreatedAtBefore(@Param("endExclusive") Instant endExclusive);

    @Query("""
            SELECT COALESCE(SUM(o.finalAmount), 0)
            FROM OrderEntity o
            WHERE o.status = com.nchuy099.SmartPharma.order.domain.enums.OrderStatus.DELIVERED
              AND o.createdAt >= :startOfDay
              AND o.createdAt < :endOfDay
            """)
    BigDecimal sumDeliveredAmountByCreatedAtBetween(@Param("startOfDay") Instant startOfDay,
            @Param("endOfDay") Instant endOfDay);

    @Query("""
            SELECT COALESCE(SUM(o.finalAmount), 0)
            FROM OrderEntity o
            WHERE o.status = com.nchuy099.SmartPharma.order.domain.enums.OrderStatus.DELIVERED
              AND o.createdAt < :endExclusive
            """)
    BigDecimal sumDeliveredAmountByCreatedAtBefore(@Param("endExclusive") Instant endExclusive);

    @Query("""
            SELECT COUNT(o)
            FROM OrderEntity o
            WHERE o.status = com.nchuy099.SmartPharma.order.domain.enums.OrderStatus.DELIVERED
              AND o.deliveredAt >= :startOfDay
              AND o.deliveredAt < :endExclusive
            """)
    long countDeliveredByDeliveredAtBetween(@Param("startOfDay") Instant startOfDay,
                                            @Param("endExclusive") Instant endExclusive);

    @Query("""
            SELECT COUNT(DISTINCT o.user.id)
            FROM OrderEntity o
            WHERE o.status = com.nchuy099.SmartPharma.order.domain.enums.OrderStatus.DELIVERED
              AND o.deliveredAt >= :startOfDay
              AND o.deliveredAt < :endExclusive
            """)
    long countDistinctDeliveredUsersByDeliveredAtBetween(@Param("startOfDay") Instant startOfDay,
                                                         @Param("endExclusive") Instant endExclusive);

    @Query("""
            SELECT COALESCE(SUM(o.finalAmount), 0)
            FROM OrderEntity o
            WHERE o.status = com.nchuy099.SmartPharma.order.domain.enums.OrderStatus.DELIVERED
              AND o.deliveredAt >= :startOfDay
              AND o.deliveredAt < :endExclusive
            """)
    BigDecimal sumDeliveredAmountByDeliveredAtBetween(@Param("startOfDay") Instant startOfDay,
                                                      @Param("endExclusive") Instant endExclusive);

    @Query("""
            SELECT COALESCE(SUM(o.finalAmount), 0)
            FROM OrderEntity o
            WHERE o.user.id IN :userIds
              AND o.status = com.nchuy099.SmartPharma.order.domain.enums.OrderStatus.DELIVERED
            """)
    BigDecimal sumDeliveredFinalAmountByUserIds(@Param("userIds") List<UUID> userIds);
}
