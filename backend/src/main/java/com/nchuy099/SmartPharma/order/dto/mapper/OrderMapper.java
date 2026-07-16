package com.nchuy099.SmartPharma.order.dto.mapper;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderReturnRequestEntity;
import com.nchuy099.SmartPharma.order.domain.repository.OrderReturnRequestRepository;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse.OrderItemDto;
import com.nchuy099.SmartPharma.order.dto.response.PreviewResponse;
import com.nchuy099.SmartPharma.order.dto.response.PreviewResponse.PreviewItemDto;
import com.nchuy099.SmartPharma.payment.application.support.PaymentQrService;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.user.entity.AddressEntity;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OrderMapper {

        private final PaymentQrService paymentQrService;
        private final OrderReturnRequestRepository orderReturnRequestRepository;

        public PreviewResponse toBuyNowPreview(ProductVariantEntity variant, int qty, BigDecimal amount) {
                return toBuyNowPreview(variant, qty, amount, variant.getSalePrice());
        }

        public PreviewResponse toBuyNowPreview(ProductVariantEntity variant, int qty, BigDecimal amount, BigDecimal unitPrice) {
                return PreviewResponse.builder()
                                .itemTotalAmount(amount)
                                .finalAmount(amount)
                                .shippingFee(BigDecimal.ZERO)
                                .items(List.of(
                                                PreviewItemDto.builder()
                                                                .productId(variant.getProduct().getId().toString())
                                                                .variantId(variant.getId().toString())
                                                                .productName(variant.getProduct().getName())
                                                                .sku(variant.getSku())
                                                                .unit(variant.getUnit())
                                                                .productWebName(variant.getProduct().getWebName())
                                                                .productSlug(variant.getProduct().getSlug())
                                                                .productImageUrl(variant.getProduct().getPrimaryImage())
                                                                .quantity(qty)
                                                                .unitPrice(unitPrice)
                                                                .build()))
                                .build();
        }

        public PreviewResponse toCartPreview(List<CartItemEntity> items, BigDecimal amount) {
                return PreviewResponse.builder()
                                .itemTotalAmount(amount)
                                .finalAmount(amount)

                                .shippingFee(BigDecimal.ZERO)
                                .items(items.stream()
                                                .map(i -> PreviewItemDto.builder()
                                                                .productId(i.getVariant().getProduct().getId().toString())
                                                                .variantId(i.getVariant().getId().toString())
                                                                .productName(i.getVariant().getProduct().getName())
                                                                .sku(i.getVariant().getSku())
                                                                .unit(i.getVariant().getUnit())
                                                                .productWebName(i.getVariant().getProduct().getWebName())
                                                                .productSlug(i.getVariant().getProduct().getSlug())
                                                                .productImageUrl(i.getVariant().getProduct().getPrimaryImage())
                                                                .quantity(i.getQuantity())
                                                                .unitPrice(i.getVariant().getSalePrice())
                                                                .build())
                                                .toList())
                                .build();
        }

        public OrderResponse toOrderResponse(OrderEntity order) {
                OrderReturnRequestEntity returnRequest = order.getId() != null
                                ? orderReturnRequestRepository.findFirstByOrderIdOrderByCreatedAtDescIdDesc(order.getId()).orElse(null)
                                : null;
                return toOrderResponse(order, null, returnRequest);
        }

        public OrderResponse toOrderResponse(OrderEntity order, AddressEntity address) {
                OrderReturnRequestEntity returnRequest = order.getId() != null
                                ? orderReturnRequestRepository.findFirstByOrderIdOrderByCreatedAtDescIdDesc(order.getId()).orElse(null)
                                : null;
                return toOrderResponse(order, address, returnRequest);
        }

        public OrderResponse toOrderResponse(OrderEntity order, OrderReturnRequestEntity returnRequest) {
                return toOrderResponse(order, null, returnRequest);
        }

        public OrderResponse toOrderResponse(OrderEntity order, AddressEntity address, OrderReturnRequestEntity returnRequest) {
                var payment = order.getPayment();
                return OrderResponse.builder()
                                .id(order.getId().toString())
                                .itemTotalAmount(order.calculateItemsTotal())
                                .finalAmount(order.getFinalAmount())

                                .shippingFee(order.getShippingFee())
                                .shippingAddress(order.getShippingAddress())
                                .ghnOrderCode(order.getGhnOrderCode())
                                .note(order.getNote())
                                .orderCode(order.getOrderCode())
                                .paymentUrl(payment != null && payment.getMethod() == PaymentMethod.BANK_TRANSFER
                                                ? paymentQrService.generateQrUrl(order.getOrderCode(),
                                                                order.getFinalAmount())
                                                : null)
                                .bankName(payment != null && payment.getMethod() == PaymentMethod.BANK_TRANSFER
                                                ? paymentQrService.getBankName()
                                                : null)
                                .bankAccount(payment != null && payment.getMethod() == PaymentMethod.BANK_TRANSFER
                                                ? paymentQrService.getAccountNumber()
                                                : null)
                                .status(order.getStatus() != null ? order.getStatus().toString() : null)
                                .address(OrderResponse.AddressDto.builder()
                                                .fullName(order.getShippingFullName())
                                                .phoneNumber(order.getShippingPhone())
                                                .address(order.getShippingAddress())
                                                .provinceName(order.getProvinceName())
                                                .districtName(order.getDistrictName())
                                                .wardName(order.getWardName())
                                                .fullAddress(buildFullAddress(order.getShippingAddress(),
                                                                order.getWardName(), order.getDistrictName(),
                                                                order.getProvinceName()))
                                                .build())
                                .paymentMethod(payment != null ? payment.getMethod().toString() : null)
                                .payment(payment != null
                                                ? OrderResponse.PaymentDto.builder()
                                                                .method(payment.getMethod().toString())
                                                                .status(payment.getStatus().toString())
                                                                .amount(payment.getAmount())
                                                                .build()
                                                : null)
                                .expectedDeliveryTime(order.getExpectedDeliveryTime())
                                .deliveredAt(order.getDeliveredAt())
                                .returnCompletedAt(order.getReturnCompletedAt())
                                .returnRequest(toReturnRequestDto(returnRequest))
                                .items(order.getItems().stream()
                                                .map(i -> {
                                                        var itemDto = OrderItemDto.builder()
                                                                        .id(i.getId().toString())
                                                                        .productId(i.getProduct().getId().toString())
                                                                        .variantId(i.getVariant().getId().toString())
                                                                        .productName(i.getSnapshotProductName())
                                                                        .productWebName(i.getProduct().getWebName())
                                                                        .productSlug(i.getProduct().getSlug())
                                                                        .sku(i.getSnapshotSku())
                                                                        .unit(i.getSnapshotUnit())
                                                                        .productImageUrl(i.getSnapshotPrimaryImage())
                                                                        .quantity(i.getQuantity())
                                                                        .unitPrice(i.getUnitPrice())
                                                                        .flashSaleReservationId(order.getFlashSaleReservationId())
                                                                        .build();

                                                        if (i.getReview() != null) {
                                                                boolean canEdit = true;
                                                                if (order.getDeliveredAt() != null) {
                                                                        var now = java.time.Instant.now();
                                                                        canEdit = now.isBefore(order.getDeliveredAt()
                                                                                        .plusSeconds(7 * 24 * 60 * 60));
                                                                }
                                                                itemDto.setReview(OrderResponse.OrderItemDto.ReviewDto
                                                                                .builder()
                                                                                .id(i.getReview().getId().toString())
                                                                                .rating(i.getReview().getRating())
                                                                                .comment(i.getReview().getComment())
                                                                                .createdAt(i.getReview().getCreatedAt())
                                                                                .canEdit(canEdit)
                                                                                .build());
                                                        }
                                                        return itemDto;
                                                })
                                                .toList())
                                .build();
        }

        private OrderResponse.ReturnRequestDto toReturnRequestDto(OrderReturnRequestEntity returnRequest) {
                if (returnRequest == null) {
                        return null;
                }
                return OrderResponse.ReturnRequestDto.builder()
                                .id(returnRequest.getId() != null ? returnRequest.getId().toString() : null)
                                .status(returnRequest.getStatus() != null ? returnRequest.getStatus().name() : null)
                                .reason(returnRequest.getReason())
                                .reviewNote(returnRequest.getReviewNote())
                                .refundAmount(returnRequest.getRefundAmount())
                                .requestedAt(returnRequest.getCreatedAt())
                                .reviewedAt(returnRequest.getReviewedAt())
                                .imageUrls(returnRequest.getImages() != null
                                                ? returnRequest.getImages().stream()
                                                                .map(image -> image.getImageUrl())
                                                                .toList()
                                                : List.of())
                                .build();
        }

        public OrderResponse toOrderResponseWithLogs(OrderEntity order,
                        com.nchuy099.SmartPharma.order.ghn.dto.OrderDetailResponseDTO ghnDetail) {
                OrderResponse response = toOrderResponse(order);
                if (ghnDetail != null) {
                        OrderResponse.ShipmentInfoDto shipment = OrderResponse.ShipmentInfoDto.builder()
                                .orderCode(ghnDetail.getOrderCode())
                                .status(ghnDetail.getStatus())
                                .fromName(ghnDetail.getFromName())
                                .fromPhone(ghnDetail.getFromPhone())
                                .fromAddress(ghnDetail.getFromAddress())
                                .toName(ghnDetail.getToName())
                                .toPhone(ghnDetail.getToPhone())
                                .toAddress(ghnDetail.getToAddress())
                                .weight(ghnDetail.getWeight())
                                .leadtime(ghnDetail.getLeadtime())
                                .build();

                        if (ghnDetail.getLog() != null) {
                                shipment.setLog(ghnDetail.getLog().stream()
                                                .map(log -> OrderResponse.ShipmentLogDto.builder()
                                                                .status(log.getStatus())
                                                                .updatedDate(log.getUpdatedDate())
                                                                .build())
                                                .toList());
                        }

                        response.setShipment(shipment);

                        if (ghnDetail.getLeadtime() != null) {
                                try {
                                        response.setExpectedDeliveryTime(
                                                        OffsetDateTime.parse(ghnDetail.getLeadtime()).toEpochSecond());
                                } catch (Exception e) {
                                        // Ignore parsing errors
                                }
                        }
                }
                return response;
        }

        public String buildFullAddress(String address, String ward, String district, String province) {
                StringBuilder sb = new StringBuilder();
                if (address != null && !address.isBlank()) {
                        sb.append(address);
                }
                if (ward != null && !ward.isBlank()) {
                        if (!sb.isEmpty())
                                sb.append(", ");
                        sb.append(ward);
                }
                if (district != null && !district.isBlank()) {
                        if (!sb.isEmpty())
                                sb.append(", ");
                        sb.append(district);
                }
                if (province != null && !province.isBlank()) {
                        if (!sb.isEmpty())
                                sb.append(", ");
                        sb.append(province);
                }
                return sb.toString();
        }

}
