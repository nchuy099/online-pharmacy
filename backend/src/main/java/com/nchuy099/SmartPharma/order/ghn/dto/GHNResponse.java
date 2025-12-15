package com.nchuy099.SmartPharma.order.ghn.dto;

import lombok.Data;

@Data
public class GHNResponse<T> {
    private int code;
    private String message;
    private T data;
}
