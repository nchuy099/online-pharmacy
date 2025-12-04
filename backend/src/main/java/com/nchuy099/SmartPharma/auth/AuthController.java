package com.nchuy099.SmartPharma.auth;


import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.auth.dto.request.ForgotPasswordReq;
import com.nchuy099.SmartPharma.auth.dto.request.LoginReq;
import com.nchuy099.SmartPharma.auth.dto.request.LogoutReq;
import com.nchuy099.SmartPharma.auth.dto.request.RefreshTokenReq;
import com.nchuy099.SmartPharma.auth.dto.request.ResetPasswordReq;
import com.nchuy099.SmartPharma.auth.dto.request.SignUpReq;

import com.nchuy099.SmartPharma.auth.dto.response.LoginResp;
import com.nchuy099.SmartPharma.auth.dto.response.RefreshTokenResp;
import com.nchuy099.SmartPharma.auth.dto.response.SignUpResp;
import com.nchuy099.SmartPharma.user.dto.request.CreateUserReq;
import com.nchuy099.SmartPharma.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    @PostMapping("/sign-up")
    public SignUpResp signUp(@Valid @RequestBody SignUpReq req) {
        log.info("Sign up request received: {}", req.getEmail());

        CreateUserReq createUserReq = CreateUserReq.builder()
                .email(req.getEmail())
                .fullName(req.getFullName())
                .password(req.getPassword())
                .build();

        return SignUpResp.builder()
                .userId(userService.create(createUserReq))
                .build();
    }

    @PostMapping("/login")
    public LoginResp login(@RequestBody LoginReq req) {
        log.info("Login request received: {}", req.getIdentifier());
        return authService.login(req);
    }

    @PostMapping("/forgot-password")
    public String forgotPassword(@RequestBody ForgotPasswordReq req) {
        log.info("Forgot password request received");
        authService.forgotPassword(req.getIdentifier());
        return "Reset password link has been sent to your email";
    }

    @PostMapping("/refresh-token")
    public RefreshTokenResp refreshToken(@RequestBody RefreshTokenReq req) {
        log.info("Refresh token request received");
        return authService.refreshToken(req.getRefreshToken());
    }


    @PostMapping("/logout")
    public String logout(@RequestBody LogoutReq req) {
        log.info("Logout request received");
        String refreshToken = req.getRefreshToken();
        authService.logout(refreshToken);
        return "Logout successful";
    }

    @PostMapping("/reset-password")
    public String resetPassword(@RequestBody ResetPasswordReq req) {
        log.info("Reset password request received");
        authService.resetPassword(req);
        return "Reset password successful";
    }

}