package com.nchuy099.SmartPharma.order.domain.policy;

import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;

@Component
public class OrderCancelPolicy {

    public void validate(OrderEntity order) {
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.CONFLICT, "Order is already cancelled");
        }
        if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.SHIPPING
                || order.getStatus() == OrderStatus.PROCESSING) {
            throw new AppException(ErrorCode.CONFLICT, "Cannot cancel order in " + order.getStatus() + " status");
        }
    }
}
