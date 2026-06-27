package com.nchuy099.SmartPharma.order.infrastructure.event;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;

    public void publishCreated(OrderEntity order) {
        applicationEventPublisher.publishEvent(new OrderCreatedEvent(order.getId()));
    }

    public void publishCancelled(OrderEntity order) {
        applicationEventPublisher.publishEvent(new OrderCancelledEvent(order.getId()));
    }

    public void publishShipped(OrderEntity order) {
        applicationEventPublisher.publishEvent(new OrderShippedEvent(order.getId()));
    }
}
