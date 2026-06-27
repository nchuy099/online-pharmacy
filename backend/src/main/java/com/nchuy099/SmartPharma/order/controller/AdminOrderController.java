package com.nchuy099.SmartPharma.order.controller;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.user.enums.RbacPermissions;
import com.nchuy099.SmartPharma.order.application.command.ConfirmOrderUseCase;
import com.nchuy099.SmartPharma.order.application.command.ShipOrderUseCase;
import com.nchuy099.SmartPharma.order.application.query.AdminOrderQueryService;
import com.nchuy099.SmartPharma.payment.application.query.PaymentQueryService;
import com.nchuy099.SmartPharma.order.dto.response.OrderPageResponse;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.payment.dto.response.PaymentResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/admin/orders")
@Slf4j
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'SUPER_ADMIN')")
public class AdminOrderController {

    private final AdminOrderQueryService adminOrderQueryService;
    private final PaymentQueryService paymentQueryService;
    private final ConfirmOrderUseCase confirmOrderUseCase;
    private final ShipOrderUseCase shipOrderUseCase;

    @GetMapping("/{id}/details")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_ORDER)")
    public OrderResponse getOrderDetails(@PathVariable(name = "id") String id) {
        log.info("Get order details request received with id: {}", id);
        return adminOrderQueryService.getDetails(UUID.fromString(id));
    }

    @GetMapping("/list")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_ORDER)")
    public OrderPageResponse getOrderHistory(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "status", required = false) String status) {
        log.info("Get order history request received (search={}, status={})", search, status);
        return adminOrderQueryService.getOrderList(page, size, search, status);
    }

    @GetMapping("/{orderId}/payment/details")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_PAYMENT)")
    public PaymentResponse getPaymentDetails(@PathVariable(name = "orderId") String orderId) {
        log.info("Get payment details request received with orderId: {}", orderId);
        return paymentQueryService.getDetailsByOrderId(orderId);
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).CONFIRM_ORDER)")
    public OrderResponse confirmOrder(@PathVariable(name = "id") String id) {
        log.info("Confirm order request received for id: {}", id);
        return confirmOrderUseCase.confirm(UUID.fromString(id));
    }

    @PostMapping("/{id}/ship")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).SHIP_ORDER)")
    public OrderResponse shipOrder(@PathVariable(name = "id") String id) {
        log.info("Ship order request received for id: {}", id);
        return shipOrderUseCase.ship(UUID.fromString(id));
    }
}
