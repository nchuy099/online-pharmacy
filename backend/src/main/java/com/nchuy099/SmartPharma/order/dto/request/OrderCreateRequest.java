package com.nchuy099.SmartPharma.order.dto.request;

import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(name = "OrderCreateRequest", description = "Create order payload. The backend validates the checkout quote and rebuilds items from live cart or buy-now data.")
public class OrderCreateRequest {

    @NotNull(message = "Checkout quote ID is required")
    @Schema(description = "ID of the checkout quote to consume")
    private UUID checkoutQuoteId;

    @NotNull(message = "Payment method is required")
    @Schema(description = "Payment method code")
    private String paymentMethod;

    @NotNull(message = "Order mode is required")
    @Schema(description = "Order mode used to rebuild live items")
    private String mode;

    @Valid
    @Schema(description = "Buy now payload when mode is BUY_NOW")
    private BuyNowItemDto buyNowItem;

    @Schema(description = "Optional note to attach to the order")
    private String note;
}
