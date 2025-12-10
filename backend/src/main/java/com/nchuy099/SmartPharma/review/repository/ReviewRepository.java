package com.nchuy099.SmartPharma.review.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.review.entity.ReviewEntity;

@Repository
public interface ReviewRepository extends JpaRepository<ReviewEntity, UUID> {

    Page<ReviewEntity> findByProductIdOrderByCreatedAtDesc(UUID productId, Pageable pageable);

    boolean existsByUserIdAndOrderItemId(UUID userId, UUID orderItemId);

    @Query("SELECT AVG(r.rating) FROM ReviewEntity r WHERE r.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") UUID productId);

    long countByProductId(UUID productId);

    Optional<ReviewEntity> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT COUNT(r) > 0 FROM ReviewEntity r WHERE r.user.id = :userId AND r.product.id = :productId AND r.orderItem.order.id = :orderId")
    boolean existsByUserIdAndProductIdAndOrderId(@Param("userId") UUID userId, @Param("productId") UUID productId, @Param("orderId") UUID orderId);
}
