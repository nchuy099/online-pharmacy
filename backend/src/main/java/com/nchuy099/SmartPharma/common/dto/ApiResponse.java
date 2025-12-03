package com.nchuy099.SmartPharma.common.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {

    private final boolean success = true;
    private String code;
    private int status;
    private String message;
    private T data;
    private Instant timestamp;

    public ApiResponse(String code, int status, String message, T data) {
        this.code = code;
        this.status = status;
        this.message = message;
        this.data = data;
        this.timestamp = Instant.now();
    }

}
