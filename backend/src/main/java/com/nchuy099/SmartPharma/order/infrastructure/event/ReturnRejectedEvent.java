package com.nchuy099.SmartPharma.order.infrastructure.event;

import java.util.UUID;

public record ReturnRejectedEvent(UUID orderId) {
}
