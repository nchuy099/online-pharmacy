package com.nchuy099.SmartPharma.payment.domain.entity;

import java.math.BigDecimal;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "payments")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentEntity extends AbstractEntity {

    @Column(nullable = false, precision = 15, scale = 2)
    BigDecimal amount;

    String externalTransactionId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    PaymentMethod method;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    OrderEntity order;

    @Column(nullable = false)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    PaymentStatus status = PaymentStatus.INITIATED;

    public void setOrder(OrderEntity order) {
        this.order = order;
        if (order != null && order.getPayment() != this) {
            order.setPayment(this);
        }
    }

}
