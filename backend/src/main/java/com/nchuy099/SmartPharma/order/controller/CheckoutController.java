package com.nchuy099.SmartPharma.order.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.order.service.OrderService;
import com.nchuy099.SmartPharma.order.dto.request.OrderPreviewRequest;
import com.nchuy099.SmartPharma.order.dto.response.PreviewResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/checkouts")
@Slf4j
@RequiredArgsConstructor
public class CheckoutController {

    private final OrderService orderService;

    @PostMapping("/create")
    public PreviewResponse createCheckout(@RequestBody OrderPreviewRequest req) {
        log.info("Checkout create request received");
        return orderService.preview(req);
    }
}
