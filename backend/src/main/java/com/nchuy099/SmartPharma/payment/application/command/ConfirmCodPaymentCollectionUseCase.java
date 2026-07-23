package com.nchuy099.SmartPharma.payment.application.command;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.mapper.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.payment.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentStatus;
import jakarta.transaction.Transactional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConfirmCodPaymentCollectionUseCase {

    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;

    @Transactional
    public OrderResponse confirmCollected(UUID orderId) {
        var order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found"));
        PaymentEntity payment = order.getPayment();
        if (payment == null) {
            throw new AppException(ErrorCode.PAYMENT_NOT_FOUND, "Payment not found");
        }
        if (payment.getMethod() != PaymentMethod.COD) {
            throw new AppException(ErrorCode.CONFLICT, "Only COD payment collection can be confirmed manually");
        }
        if (payment.getStatus() != PaymentStatus.PENDING_COLLECTION) {
            throw new AppException(ErrorCode.CONFLICT,
                    "Cannot confirm COD collection in " + payment.getStatus() + " status");
        }

        payment.setStatus(PaymentStatus.COMPLETED);
        orderRepository.save(order);
        return orderMapper.toOrderResponse(order);
    }
}
