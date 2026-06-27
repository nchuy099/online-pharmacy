package com.nchuy099.SmartPharma.payment.infrastructure.provider;

import java.math.BigDecimal;

public interface PaymentProvider {

    String generateQrUrl(String orderCode, BigDecimal amount);

    String getAccountNumber();

    String getBankName();
}
