package com.nchuy099.SmartPharma.order.application.checkout;

import java.util.UUID;

import com.nchuy099.SmartPharma.order.application.create.CheckoutContext;
import com.nchuy099.SmartPharma.order.dto.request.OrderCreateRequest;
import com.nchuy099.SmartPharma.order.dto.request.OrderPreviewRequest;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;

public interface CheckoutStrategy {

    boolean supports(OrderMode mode, boolean flashSale);

    CheckoutContext prepareForPreview(OrderPreviewRequest request, UUID userId);

    CheckoutContext prepareForCreate(OrderCreateRequest request, UUID userId);
}
