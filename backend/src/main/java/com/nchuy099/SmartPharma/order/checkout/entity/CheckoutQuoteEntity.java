package com.nchuy099.SmartPharma.order.checkout.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "checkout_quotes")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckoutQuoteEntity extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    UserEntity user;

    @Column(name = "address_id", nullable = false)
    UUID addressId;

    @Column(name = "shipping_fee", nullable = false)
    BigDecimal shippingFee;

    @Column(name = "shipping_service_id", nullable = false)
    Integer shippingServiceId;

    @Column(name = "expected_delivery_time", nullable = false)
    Long expectedDeliveryTime;

    @Column(name = "expires_at", nullable = false)
    Instant expiresAt;

    @Column(name = "consumed_at")
    Instant consumedAt;
}
