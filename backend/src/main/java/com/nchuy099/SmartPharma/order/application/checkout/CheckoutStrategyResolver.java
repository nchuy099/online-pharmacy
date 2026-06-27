package com.nchuy099.SmartPharma.order.application.checkout;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CheckoutStrategyResolver {

    private final List<CheckoutStrategy> strategies;

    public CheckoutStrategy resolve(OrderMode mode, UUID flashSaleReservationId) {
        boolean flashSale = flashSaleReservationId != null;
        return strategies.stream()
                .filter(strategy -> strategy.supports(mode, flashSale))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "Unsupported order mode"));
    }
}
