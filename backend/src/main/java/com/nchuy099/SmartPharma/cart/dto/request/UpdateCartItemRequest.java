package com.nchuy099.SmartPharma.cart.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCartItemRequest {
    private Integer quantity;
    private Boolean selected;
}
