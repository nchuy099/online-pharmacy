package com.nchuy099.SmartPharma.order.domain.enums;

public enum OrderStatus {
    PENDING_PAYMENT,
    PENDING_CONFIRMATION,
    CONFIRMED,
    PROCESSING,
    SHIPPING,
    DELIVERED,
    RETURN_REQUESTED,
    RETURNED,
    CANCELLED
}
