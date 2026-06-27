package com.nchuy099.SmartPharma.order.domain.policy;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class OrderStatusPolicy {

    private static final Set<OrderStatus> TERMINAL_STATUSES = EnumSet.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED);

    public void confirm(OrderEntity order) {
        transition(order, EnumSet.of(OrderStatus.PENDING), OrderStatus.PROCESSING, "confirm");
    }

    public void ship(OrderEntity order) {
        transition(order, EnumSet.of(OrderStatus.PROCESSING), OrderStatus.SHIPPING, "ship");
    }

    public void ensureCanShip(OrderEntity order) {
        assertTransitionAllowed(order, EnumSet.of(OrderStatus.PROCESSING), "ship");
    }

    public void cancel(OrderEntity order) {
        transition(order, EnumSet.of(OrderStatus.PENDING, OrderStatus.PENDING_PAYMENT), OrderStatus.CANCELLED, "cancel");
    }

    public void markPartialPayment(OrderEntity order) {
        transition(order, EnumSet.of(OrderStatus.PENDING, OrderStatus.PENDING_PAYMENT), OrderStatus.PENDING_PAYMENT,
                "mark partial payment");
    }

    public void markPaymentSuccess(OrderEntity order) {
        transition(order, EnumSet.of(OrderStatus.PENDING, OrderStatus.PENDING_PAYMENT), OrderStatus.PENDING,
                "mark payment success");
    }

    public void syncFromGhn(OrderEntity order, String ghnStatus) {
        if (order == null || ghnStatus == null || ghnStatus.isBlank()) {
            return;
        }

        OrderStatus targetStatus = mapGhnStatus(ghnStatus);
        if (targetStatus == null) {
            return;
        }

        OrderStatus currentStatus = order.getStatus();
        if (currentStatus == null || TERMINAL_STATUSES.contains(currentStatus) || targetStatus == currentStatus) {
            return;
        }

        if (targetStatus == OrderStatus.CANCELLED || targetStatus == OrderStatus.DELIVERED
                || precedence(targetStatus) > precedence(currentStatus)) {
            applyStatus(order, targetStatus);
        }
    }

    private void transition(OrderEntity order, Set<OrderStatus> allowedSources, OrderStatus targetStatus,
            String actionName) {
        assertTransitionAllowed(order, allowedSources, actionName);
        if (order.getStatus() != targetStatus) {
            applyStatus(order, targetStatus);
        }
    }

    private void assertTransitionAllowed(OrderEntity order, Set<OrderStatus> allowedSources, String actionName) {
        if (order == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Order is required");
        }
        OrderStatus currentStatus = order.getStatus();
        if (currentStatus == null) {
            throw new AppException(ErrorCode.CONFLICT, "Cannot " + actionName + " order with missing status");
        }
        if (TERMINAL_STATUSES.contains(currentStatus) || !allowedSources.contains(currentStatus)) {
            throw new AppException(ErrorCode.CONFLICT,
                    "Cannot " + actionName + " order in " + currentStatus + " status");
        }
    }

    private void applyStatus(OrderEntity order, OrderStatus targetStatus) {
        OrderStatus currentStatus = order.getStatus();
        if (currentStatus == targetStatus) {
            return;
        }
        log.debug("Transition order {} from {} to {}", order.getId(), currentStatus, targetStatus);
        order.setStatus(targetStatus);
        if (targetStatus == OrderStatus.DELIVERED && order.getDeliveredAt() == null) {
            order.setDeliveredAt(Instant.now());
        }
    }

    private OrderStatus mapGhnStatus(String ghnStatus) {
        String normalized = ghnStatus.toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "delivered" -> OrderStatus.DELIVERED;
            case "cancel", "returned" -> OrderStatus.CANCELLED;
            case "shipping", "shipped", "picked", "transporting", "sorting", "delivering",
                    "money_collect_delivering" -> OrderStatus.SHIPPING;
            default -> null;
        };
    }

    private int precedence(OrderStatus status) {
        return switch (status) {
            case PENDING -> 0;
            case PENDING_PAYMENT -> 1;
            case PROCESSING -> 2;
            case SHIPPING -> 3;
            case DELIVERED, CANCELLED -> 4;
        };
    }
}
