package com.nchuy099.SmartPharma.order.domain.enums;

public enum OrderStatus {
    PENDING,
    PENDING_PAYMENT,
    CONFIRMED,
    PROCESSING,
    SHIPPING,
    DELIVERED,
    RETURN_REQUESTED,
    RETURNED,
    CANCELLED
}
