package com.nchuy099.SmartPharma.auth.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordReq {
    String token;
    String newPassword;
    String confirmNewPassword;
}
