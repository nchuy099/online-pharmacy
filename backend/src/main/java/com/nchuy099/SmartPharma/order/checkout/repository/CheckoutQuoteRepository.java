package com.nchuy099.SmartPharma.order.checkout.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.nchuy099.SmartPharma.order.checkout.entity.CheckoutQuoteEntity;

import jakarta.persistence.LockModeType;

public interface CheckoutQuoteRepository extends JpaRepository<CheckoutQuoteEntity, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select cq from CheckoutQuoteEntity cq where cq.id = :id and cq.user.id = :userId")
    Optional<CheckoutQuoteEntity> findByIdAndUserIdForUpdate(@Param("id") UUID id, @Param("userId") UUID userId);

    Optional<CheckoutQuoteEntity> findByIdAndUserId(UUID id, UUID userId);
}
