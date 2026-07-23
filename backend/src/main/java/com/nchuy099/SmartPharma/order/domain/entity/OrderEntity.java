package com.nchuy099.SmartPharma.order.domain.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.payment.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Entity
@Table(name = "orders")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderEntity extends AbstractEntity {

    @Column(unique = true)
    String orderCode;

    String idempotencyKey;

    String note;

    String shippingFullName;
    String shippingPhone;
    String shippingAddress;
    BigDecimal shippingFee;
    Integer ghnDistrictId;
    String ghnWardCode;
    String provinceName;
    String districtName;
    String wardName;
    String ghnOrderCode;
    @Column(name = "flash_sale_reservation_id")
    java.util.UUID flashSaleReservationId;
    Integer ghnServiceId;
    Long expectedDeliveryTime;
    java.time.Instant deliveredAt;
    java.time.Instant returnCompletedAt;

    BigDecimal itemTotalAmount;

    @Column(nullable = false)
    BigDecimal finalAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    UserEntity user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    List<OrderItemEntity> items = new ArrayList<>();

    @Builder.Default
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    OrderStatus status = OrderStatus.PENDING_CONFIRMATION;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    PaymentEntity payment;

    @Builder.Default
    @Column(nullable = false)
    Boolean stockExported = false;

    String cancelReason;

    public void setPayment(PaymentEntity payment) {
        this.payment = payment;
        if (payment != null && payment.getOrder() != this) {
            payment.setOrder(this);
        }
    }

    public void addItem(OrderItemEntity item) {
        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItemEntity item) {
        items.remove(item);
        item.setOrder(null);
    }

    public BigDecimal calculateItemsTotal() {
        return items.stream().map(OrderItemEntity::calculateTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calculateFinalAmount() {
        return this.calculateItemsTotal().add(BigDecimal.ZERO);
    }

}
