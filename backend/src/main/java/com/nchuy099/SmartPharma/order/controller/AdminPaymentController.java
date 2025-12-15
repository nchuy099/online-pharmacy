package com.nchuy099.SmartPharma.order.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.order.service.OrderService;
import com.nchuy099.SmartPharma.order.service.PaymentService;
import com.nchuy099.SmartPharma.order.dto.response.OrderPageResponse;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.order.dto.response.PaymentResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/admin/payments")
@Slf4j
@RequiredArgsConstructor
public class AdminPaymentController {

    private final PaymentService paymentService;

    // @GetMapping("/{id}/details")
    // public PaymentResponse getDetails(@PathVariable(name = "id") String id) {
    // log.info("Get payment details request received with id: {}", id);
    // return paymentService.getDetails(id);
    // }

}
