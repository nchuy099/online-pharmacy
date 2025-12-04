package com.nchuy099.SmartPharma.auth.dto.request;

import lombok.Getter;

@Getter
public class LoginReq {

    private String identifier;
    private String password;
}
