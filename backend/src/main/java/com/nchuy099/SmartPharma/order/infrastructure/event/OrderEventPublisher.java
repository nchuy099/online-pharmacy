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

    public void publishPaymentSucceeded(OrderEntity order) {
        applicationEventPublisher.publishEvent(new PaymentSucceededEvent(order.getId()));
    }

    public void publishConfirmed(OrderEntity order) {
        applicationEventPublisher.publishEvent(new OrderConfirmedEvent(order.getId()));
    }

    public void publishProcessingStarted(OrderEntity order) {
        applicationEventPublisher.publishEvent(new OrderProcessingStartedEvent(order.getId()));
    }

    public void publishDelivered(OrderEntity order) {
        applicationEventPublisher.publishEvent(new OrderDeliveredEvent(order.getId()));
    }

    public void publishReturnRequested(OrderEntity order) {
        applicationEventPublisher.publishEvent(new ReturnRequestedEvent(order.getId()));
    }

    public void publishReturnApproved(OrderEntity order) {
        applicationEventPublisher.publishEvent(new ReturnApprovedEvent(order.getId()));
    }

    public void publishReturnRejected(OrderEntity order) {
        applicationEventPublisher.publishEvent(new ReturnRejectedEvent(order.getId()));
    }
}
