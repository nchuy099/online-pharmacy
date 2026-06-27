package com.nchuy099.SmartPharma.payment.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.payment.application.webhook.ProcessSePayWebhookUseCase;
import com.nchuy099.SmartPharma.payment.dto.request.SePayWebhookRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/internal/sepay")
@Slf4j
@RequiredArgsConstructor
public class SePayController {

    private final ProcessSePayWebhookUseCase processSePayWebhookUseCase;

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody SePayWebhookRequest request) {

        log.info("Received SePay webhook: {}", request);

        try {
            Map<String, Object> result = processSePayWebhookUseCase.processWebhook(authHeader, request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error processing SePay webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
