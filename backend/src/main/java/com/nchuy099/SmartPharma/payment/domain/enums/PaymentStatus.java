package com.nchuy099.SmartPharma.payment.domain.enums;

public enum PaymentStatus {
    INITIATED,
    PROCESSING,
    PARTIAL,
    COMPLETED,
    FAILED,
    CANCELLED, // nguoi dung chu dong huy
    REFUND_PENDING,
    REFUNDED,
}
