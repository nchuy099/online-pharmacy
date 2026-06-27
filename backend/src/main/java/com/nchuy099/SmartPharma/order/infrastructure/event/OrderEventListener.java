package com.nchuy099.SmartPharma.order.infrastructure.event;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.nchuy099.SmartPharma.event.dto.request.CreateEventRequest;
import com.nchuy099.SmartPharma.event.enums.EventType;
import com.nchuy099.SmartPharma.event.service.EventService;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OrderEventListener {

    private final OrderRepository orderRepository;
    private final EventService eventService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(OrderCreatedEvent event) {
        orderRepository.findById(event.orderId()).ifPresent(order -> order.getItems().forEach(item -> eventService
                .createEvent(CreateEventRequest.builder()
                        .userId(order.getUser() != null ? order.getUser().getId().toString() : null)
                        .eventType(EventType.PURCHASE)
                        .itemId(item.getVariant().getId().toString())
                        .metadata("{\"orderCode\":\"" + order.getOrderCode() + "\"}")
                        .build())));
    }
}
