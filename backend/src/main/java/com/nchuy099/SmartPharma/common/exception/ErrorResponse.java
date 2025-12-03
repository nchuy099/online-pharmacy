package com.nchuy099.SmartPharma.common.exception;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ErrorResponse {

    private final boolean success = false;
    private String code;
    private int status;
    private String path;
    private String message;
    private String timestamp;

    public ErrorResponse(String code, int status, String path, String message) {
        this.code = code;
        this.status = status;
        this.path = path;
        this.message = message;
        this.timestamp = Instant.now().toString();
    }

}
