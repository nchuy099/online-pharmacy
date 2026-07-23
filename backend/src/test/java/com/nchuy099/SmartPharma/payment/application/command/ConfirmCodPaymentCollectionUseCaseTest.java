package com.nchuy099.SmartPharma.payment.application.command;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.mapper.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.payment.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentStatus;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ConfirmCodPaymentCollectionUseCaseTest {

    @Test
    void confirmsPendingCodCollection() {
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderMapper orderMapper = mock(OrderMapper.class);
        ConfirmCodPaymentCollectionUseCase useCase = new ConfirmCodPaymentCollectionUseCase(orderRepository, orderMapper);
        UUID orderId = UUID.randomUUID();
        OrderEntity order = order(PaymentMethod.COD, PaymentStatus.PENDING_COLLECTION);
        OrderResponse expected = OrderResponse.builder().id(orderId.toString()).build();

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);
        when(orderMapper.toOrderResponse(order)).thenReturn(expected);

        OrderResponse response = useCase.confirmCollected(orderId);

        assertEquals(expected, response);
        assertEquals(PaymentStatus.COMPLETED, order.getPayment().getStatus());
        verify(orderRepository).save(order);
    }

    @Test
    void rejectsNonCodPayment() {
        OrderRepository orderRepository = mock(OrderRepository.class);
        ConfirmCodPaymentCollectionUseCase useCase = new ConfirmCodPaymentCollectionUseCase(
                orderRepository,
                mock(OrderMapper.class));
        UUID orderId = UUID.randomUUID();

        when(orderRepository.findByIdForUpdate(orderId))
                .thenReturn(Optional.of(order(PaymentMethod.BANK_TRANSFER, PaymentStatus.COMPLETED)));

        assertThrows(AppException.class, () -> useCase.confirmCollected(orderId));
    }

    private static OrderEntity order(PaymentMethod method, PaymentStatus status) {
        OrderEntity order = OrderEntity.builder().build();
        PaymentEntity payment = PaymentEntity.builder()
                .method(method)
                .status(status)
                .build();
        order.setPayment(payment);
        return order;
    }
}
