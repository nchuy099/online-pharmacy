package com.nchuy099.SmartPharma.order.dto.request;

import java.util.List;
import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderPreviewRequest {

    private String mode; // BUY_NOW or CART

    private BuyNowItemDto buyNowItem;

    private UUID addressId;
    private Integer serviceId;
    private String note;
}
