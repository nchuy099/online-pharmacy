package com.nchuy099.SmartPharma.auth.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LogoutReq {
    String refreshToken;
}
