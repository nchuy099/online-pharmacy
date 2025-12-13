package com.nchuy099.SmartPharma.cart.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;

@Repository
public interface CartItemRepository extends JpaRepository<CartItemEntity, UUID> {
        Optional<CartItemEntity> findByVariant_IdAndCart_Id(UUID variantId, UUID cartId);

        List<CartItemEntity> findByVariant_IdInAndCart_User_Id(List<UUID> variantIds, UUID userId);

        Optional<CartItemEntity> findByIdAndCart_User_Id(UUID id, UUID userId);

        @Query("""
                            select distinct ci from CartItemEntity ci
                            join fetch ci.variant v
                            left join fetch v.inventory
                            join fetch v.product p
                            left join fetch p.images
                            join ci.cart c
                            where ci.id in :ids
                            and c.user.id = :userId
                        """)
        List<CartItemEntity> findAllWithProductByIdsAndUserId(
                        @Param("ids") List<UUID> ids,
                        @Param("userId") UUID userId);

        // clear : xoa trong ram
        // flush : flush cac thay doi chua duoc day xuong thuc thi tai db
        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query("DELETE FROM CartItemEntity ci WHERE ci.cart.user.id = :userId")
        void deleteAllCartItemsByUserId(UUID userId);

        @Query("""
                        SELECT DISTINCT ci FROM CartItemEntity ci
                        JOIN FETCH ci.variant v
                        LEFT JOIN FETCH v.inventory
                        JOIN FETCH v.product p
                        WHERE ci.cart.id = :cartId
                        AND (
                            ci.createdAt < :createdAt
                            OR (ci.createdAt = :createdAt AND ci.id < :id)
                        )
                        ORDER BY ci.createdAt DESC, ci.id DESC
                        """)
        List<CartItemEntity> findUserCartList(@Param("id") UUID id,
                        @Param("createdAt") Instant createdAt,
                        @Param("cartId") UUID cartId,
                        Pageable pageable);

        @Query("""
                            select distinct ci from CartItemEntity ci
                            join fetch ci.variant v
                            left join fetch v.inventory
                            join fetch v.product p
                            left join fetch p.images
                            join ci.cart c
                            join c.user u
                            where ci.id in :cartItemIds
                              and u.id = :userId
                        """)
        List<CartItemEntity> findAllValidCartItems(
                        List<UUID> cartItemIds,
                        UUID userId);

        @Query("""
                            select distinct ci from CartItemEntity ci
                            join fetch ci.variant v
                            left join fetch v.inventory
                            join fetch v.product p
                            left join fetch p.images
                            join ci.cart c
                            join c.user u
                            where u.id = :userId
                              and ci.selected = true
                        """)
        List<CartItemEntity> findSelectedCartItemsByUserId(@Param("userId") UUID userId);

        @Query("SELECT COUNT(ci) FROM CartItemEntity ci WHERE ci.cart.id = :cartId")
        long countByCartId(@Param("cartId") UUID cartId);

        @Query("SELECT COUNT(ci) FROM CartItemEntity ci WHERE ci.cart.id = :cartId AND ci.selected = true")
        long countSelectedByCartId(@Param("cartId") UUID cartId);

        @Query("""
                        SELECT COALESCE(SUM(ci.quantity * v.salePrice), 0)
                        FROM CartItemEntity ci
                        JOIN ci.variant v
                        WHERE ci.cart.id = :cartId
                        AND ci.selected = true
                        """)
        java.math.BigDecimal sumSelectedGrandTotalByCartId(@Param("cartId") UUID cartId);
}
