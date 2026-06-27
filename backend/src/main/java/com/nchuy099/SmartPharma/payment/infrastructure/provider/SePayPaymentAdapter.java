package com.nchuy099.SmartPharma.payment.infrastructure.provider;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SePayPaymentAdapter implements PaymentProvider {

    @Value("${sepay.accountNumber}")
    private String accountNumber;

    @Value("${sepay.bankName}")
    private String bankName;

    @Override
    public String generateQrUrl(String orderCode, BigDecimal amount) {
        return String.format("https://qr.sepay.vn/img?acc=%s&bank=%s&amount=%s&des=%s",
                accountNumber, bankName, amount.toPlainString(), orderCode);
    }

    @Override
    public String getAccountNumber() {
        return accountNumber;
    }

    @Override
    public String getBankName() {
        return bankName;
    }
}
