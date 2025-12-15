package com.nchuy099.SmartPharma.order.domain.enums;

public enum PaymentStatus {
    INITIATED,
    PROCESSING,
    PARTIAL,
    COMPLETED,
    FAILED,
    CANCELLED, // nguoi dung chu dong huy
    REFUNDED,
}
