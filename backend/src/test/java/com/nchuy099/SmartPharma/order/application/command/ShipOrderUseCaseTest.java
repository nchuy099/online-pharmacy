package com.nchuy099.SmartPharma.order.application.command;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.nchuy099.SmartPharma.inventory.service.InventoryReservationService;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.policy.OrderStatusPolicy;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.mapper.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderEventPublisher;
import com.nchuy099.SmartPharma.order.infrastructure.shipping.ShippingProvider;
import com.nchuy099.SmartPharma.payment.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentStatus;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ShipOrderUseCaseTest {

    @Test
    void shipCodOrderMarksPaymentPendingCollection() {
        OrderRepository orderRepository = mock(OrderRepository.class);
        ShippingProvider shippingProvider = mock(ShippingProvider.class);
        InventoryReservationService inventoryReservationService = mock(InventoryReservationService.class);
        OrderMapper orderMapper = mock(OrderMapper.class);
        OrderEventPublisher orderEventPublisher = mock(OrderEventPublisher.class);
        ShipOrderUseCase useCase = new ShipOrderUseCase(
                orderRepository,
                new OrderStatusPolicy(),
                shippingProvider,
                inventoryReservationService,
                orderMapper,
                orderEventPublisher);
        UUID orderId = UUID.randomUUID();
        OrderEntity order = OrderEntity.builder()
                .status(OrderStatus.PROCESSING)
                .stockExported(false)
                .build();
        order.setPayment(PaymentEntity.builder()
                .method(PaymentMethod.COD)
                .status(PaymentStatus.PENDING)
                .build());
        OrderResponse expected = OrderResponse.builder().id(orderId.toString()).build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(shippingProvider.createShipment(order, null, null, null, null, null, null, null, null))
                .thenReturn("GHN-001");
        when(orderRepository.save(order)).thenReturn(order);
        when(orderMapper.toOrderResponse(order)).thenReturn(expected);

        OrderResponse response = useCase.ship(orderId);

        assertEquals(expected, response);
        assertEquals(OrderStatus.SHIPPING, order.getStatus());
        assertEquals(PaymentStatus.PENDING_COLLECTION, order.getPayment().getStatus());
        verify(inventoryReservationService).commitOrderReservation(order, null);
        verify(orderEventPublisher).publishShipped(order);
    }
}
