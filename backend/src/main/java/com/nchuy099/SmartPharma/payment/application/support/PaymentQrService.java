package com.nchuy099.SmartPharma.payment.application.support;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.payment.infrastructure.provider.PaymentProvider;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentQrService {

    private final PaymentProvider paymentProvider;

    public String generateQrUrl(String orderCode, BigDecimal amount) {
        return paymentProvider.generateQrUrl(orderCode, amount);
    }

    public String getAccountNumber() {
        return paymentProvider.getAccountNumber();
    }

    public String getBankName() {
        return paymentProvider.getBankName();
    }
}
