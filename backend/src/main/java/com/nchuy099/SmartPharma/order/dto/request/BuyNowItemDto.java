package com.nchuy099.SmartPharma.order.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BuyNowItemDto {
    private String variantId;
    private Integer quantity;
}
