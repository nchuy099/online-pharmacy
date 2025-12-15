package com.nchuy099.SmartPharma.order.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.order.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.order.domain.repository.PaymentRepository;
import com.nchuy099.SmartPharma.order.dto.response.PaymentResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentResponse getDetailsByOrderId(String stringId) {
        log.info("Fetching payment details");
        UUID id = UUID.fromString(stringId);
        PaymentEntity payment = paymentRepository.findByOrder_Id(id).orElseThrow(
                () -> {
                    log.warn("Payment not found");
                    throw new AppException(ErrorCode.NOT_FOUND, "Payment not found");
                });

        return PaymentResponse.builder()
                .id(payment.getId().toString())
                .method(payment.getMethod().name())
                .amount(payment.getAmount())
                .status(payment.getStatus().name())
                .build();
    }
}
