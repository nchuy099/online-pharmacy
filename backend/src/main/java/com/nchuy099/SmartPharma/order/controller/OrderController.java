package com.nchuy099.SmartPharma.order.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import com.nchuy099.SmartPharma.order.application.cancel.CancelOrderUseCase;
import com.nchuy099.SmartPharma.order.application.command.TrackOrderUseCase;
import com.nchuy099.SmartPharma.order.application.create.CreateOrderUseCase;
import com.nchuy099.SmartPharma.order.application.preview.OrderPreviewUseCase;
import com.nchuy099.SmartPharma.order.application.query.OrderQueryService;
import com.nchuy099.SmartPharma.order.application.returnrequest.OrderReturnRequestService;
import com.nchuy099.SmartPharma.order.dto.request.CreateOrderReturnRequest;
import com.nchuy099.SmartPharma.order.dto.request.OrderCancelRequest;
import com.nchuy099.SmartPharma.order.dto.request.OrderCreateRequest;
import com.nchuy099.SmartPharma.order.dto.request.OrderPreviewRequest;
import com.nchuy099.SmartPharma.order.dto.response.OrderPageResponse;
import com.nchuy099.SmartPharma.order.dto.response.OrderReturnEvidenceUploadUrlResponse;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.order.dto.response.PreviewResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/orders")
@Slf4j
@RequiredArgsConstructor
public class OrderController {

    private final CreateOrderUseCase createOrderUseCase;
    private final OrderPreviewUseCase orderPreviewUseCase;
    private final OrderQueryService orderQueryService;
    private final CancelOrderUseCase cancelOrderUseCase;
    private final TrackOrderUseCase trackOrderUseCase;
    private final OrderReturnRequestService orderReturnRequestService;

    @PostMapping("/create")
    @Operation(summary = "Create order", description = "Consumes a one-time checkout quote and creates the order if the quote is still valid.")
    public OrderResponse createOrder(@RequestBody @jakarta.validation.Valid OrderCreateRequest req) {
        log.info("Order create request received");
        return createOrderUseCase.create(req);
    }

    @PostMapping("/preview")
    @Operation(summary = "Preview order", description = "Calculates preview totals and shipping on the backend.")
    public PreviewResponse previewOrder(@RequestBody OrderPreviewRequest req) {
        log.info("Order preview request received");
        return orderPreviewUseCase.preview(req);
    }

    @GetMapping("/{id}/details")
    public OrderResponse getOrderDetails(@PathVariable(name = "id") String id) {
        log.info("Get order details request received with id: {}", id);
        return orderQueryService.getDetails(UUID.fromString(id));
    }

    @GetMapping("/history")
    public OrderPageResponse getOrderHistory(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        log.info("Get order history request received");
        return orderQueryService.getUserOrderHistory(page, size);
    }

    @PutMapping("/{id}/cancel")
    public void cancelOrder(@PathVariable(name = "id") String id, @RequestBody OrderCancelRequest req) {
        log.info("Cancel order request received with id: {}", id);
        cancelOrderUseCase.cancel(UUID.fromString(id), req);
    }

    @PostMapping("/{id}/return-requests")
    public OrderResponse createReturnRequest(
            @PathVariable(name = "id") String id,
            @RequestBody @jakarta.validation.Valid CreateOrderReturnRequest req) {
        log.info("Return order request received with id: {}", id);
        return orderReturnRequestService.create(UUID.fromString(id), req);
    }

    @PostMapping("/{id}/return-requests/images/upload-url/create")
    public OrderReturnEvidenceUploadUrlResponse createReturnEvidenceUploadUrl(@PathVariable(name = "id") String id) {
        log.info("Create return evidence upload url request received with id: {}", id);
        return orderReturnRequestService.createEvidenceUploadUrl(UUID.fromString(id));
    }

    @GetMapping("/tracking/{ghnOrderCode}")
    public OrderResponse trackOrder(@PathVariable(name = "ghnOrderCode") String ghnOrderCode) {
        log.info("Track order request received with GHN code: {}", ghnOrderCode);
        return trackOrderUseCase.track(ghnOrderCode);
    }
}
