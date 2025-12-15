package com.nchuy099.SmartPharma.order.domain.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.order.domain.entity.PaymentEntity;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentEntity, UUID> {

    Optional<PaymentEntity> findByOrder_Id(UUID orderId);

    Optional<PaymentEntity> findByExternalTransactionId(String externalTransactionId);
}
