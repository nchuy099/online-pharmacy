package com.nchuy099.SmartPharma.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
public class LoginResp {
    private String accessToken;
    private String refreshToken;
    private UserResponse user;

    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Getter
    public static class UserResponse {
        private String id;
        private String email;
        private String fullName;
        private String avatarUrl;
    }
}
