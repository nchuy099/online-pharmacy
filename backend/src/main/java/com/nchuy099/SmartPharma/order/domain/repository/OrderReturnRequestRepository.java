package com.nchuy099.SmartPharma.order.domain.repository;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.order.domain.entity.OrderReturnRequestEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderReturnRequestStatus;

@Repository
public interface OrderReturnRequestRepository extends JpaRepository<OrderReturnRequestEntity, UUID> {

    boolean existsByOrderIdAndStatusIn(UUID orderId, Collection<OrderReturnRequestStatus> statuses);

    @EntityGraph(attributePaths = "images")
    Optional<OrderReturnRequestEntity> findFirstByOrderIdOrderByCreatedAtDescIdDesc(UUID orderId);

    @EntityGraph(attributePaths = "images")
    Optional<OrderReturnRequestEntity> findFirstByOrderIdAndStatusOrderByCreatedAtDescIdDesc(
            UUID orderId,
            OrderReturnRequestStatus status);
}
