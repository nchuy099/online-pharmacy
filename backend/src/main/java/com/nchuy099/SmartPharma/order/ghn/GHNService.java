package com.nchuy099.SmartPharma.order.ghn;

import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.ghn.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GHNService {
        private final GHNClient ghnClient;
        private final GHNConfig ghnConfig;
        private volatile PickupLocation resolvedPickupLocation;

        private static final int DEFAULT_WEIGHT = 200; // gram
        private static final int DEFAULT_LENGTH = 10; // cm
        private static final int DEFAULT_WIDTH = 10; // cm
        private static final int DEFAULT_HEIGHT = 10; // cm

        private record PickupLocation(Integer shopId, Integer districtId, String wardCode, String name, String address) {
        }

        private PickupLocation resolvePickupLocation() {
                PickupLocation cached = resolvedPickupLocation;
                if (cached != null) {
                        return cached;
                }

                Integer configuredShopId = parseConfiguredShopId();
                if (configuredShopId == null) {
                        return buildFallbackPickupLocation("GHN_SHOP_ID is missing or invalid");
                }

                try {
                        List<ShopDTO> shops = ghnClient.getShops(0, 200, "");
                        if (shops.isEmpty()) {
                                return buildFallbackPickupLocation("GHN shop list is empty");
                        }

                        ShopDTO matchedShop = shops.stream()
                                        .filter(shop -> configuredShopId.equals(shop.getId()))
                                        .findFirst()
                                        .orElse(null);

                        if (matchedShop == null) {
                                log.warn(
                                                "Could not find GHN shop with id {} in /v2/shop/all response. Falling back to configured origin values.",
                                                configuredShopId);
                                return buildFallbackPickupLocation("GHN shop id " + configuredShopId + " not found in shop list");
                        }

                        if (matchedShop.getDistrictId() == null || matchedShop.getWardCode() == null
                                        || matchedShop.getWardCode().isBlank()) {
                                log.warn(
                                                "Matched GHN shop {} is missing pickup location fields. districtId={}, wardCode={}. Falling back to configured origin values.",
                                                matchedShop.getId(),
                                                matchedShop.getDistrictId(),
                                                matchedShop.getWardCode());
                                return buildFallbackPickupLocation("Matched GHN shop has missing pickup location fields");
                        }

                        PickupLocation resolved = new PickupLocation(
                                        matchedShop.getId(),
                                        matchedShop.getDistrictId(),
                                        matchedShop.getWardCode(),
                                        matchedShop.getName(),
                                        matchedShop.getAddress());
                        resolvedPickupLocation = resolved;

                        log.info(
                                        "Resolved GHN pickup shop from API: shopId={}, name={}, districtId={}, wardCode={}, address={}",
                                        resolved.shopId(),
                                        resolved.name(),
                                        resolved.districtId(),
                                        resolved.wardCode(),
                                        resolved.address());
                        return resolved;
                } catch (Exception e) {
                        log.warn("Failed to resolve GHN shop list from /v2/shop/all. Falling back to configured origin values: {}",
                                        e.getMessage(), e);
                        return buildFallbackPickupLocation("GHN shop lookup failed");
                }
        }

        private Integer parseConfiguredShopId() {
                String shopId = ghnConfig.getShopId();
                if (shopId == null || shopId.isBlank()) {
                        log.warn("GHN_SHOP_ID is not configured");
                        return null;
                }

                try {
                        return Integer.parseInt(shopId.trim());
                } catch (NumberFormatException e) {
                        log.warn("GHN_SHOP_ID is not a valid integer: {}", shopId);
                        return null;
                }
        }

        private PickupLocation buildFallbackPickupLocation(String reason) {
                log.warn(
                                "Using configured GHN pickup origin because {}. fromDistrictId={}, fromWardCode={}",
                                reason,
                                ghnConfig.getFromDistrictId(),
                                ghnConfig.getFromWardCode());
                return new PickupLocation(
                                parseConfiguredShopId(),
                                ghnConfig.getFromDistrictId(),
                                ghnConfig.getFromWardCode(),
                                null,
                                null);
        }

        public List<com.nchuy099.SmartPharma.order.dto.response.PreviewResponse.ShippingMethodDto> getAvailableShippingMethods(
                        OrderEntity order, Integer toDistrictId, String toWardCode) {

                // Always use service_type_id 2 (Standard) as requested
                BigDecimal baseFee = calculateShippingFee(order, toDistrictId, toWardCode, null);
                Long leadTime = calculateLeadTime(toDistrictId, toWardCode, 2);

                return List.of(
                                com.nchuy099.SmartPharma.order.dto.response.PreviewResponse.ShippingMethodDto.builder()
                                                .serviceId(3)
                                                .name("Tiết kiệm")
                                                .fee(baseFee.multiply(new BigDecimal("0.8")))
                                                .expectedDeliveryTime(leadTime != null ? leadTime + 86400 : null) // +1
                                                                                                                  // day
                                                                                                                  // for
                                                                                                                  // economy
                                                .build(),
                                com.nchuy099.SmartPharma.order.dto.response.PreviewResponse.ShippingMethodDto.builder()
                                                .serviceId(2)
                                                .name("Tiêu chuẩn")
                                                .fee(baseFee)
                                                .expectedDeliveryTime(leadTime)
                                                .build(),
                                com.nchuy099.SmartPharma.order.dto.response.PreviewResponse.ShippingMethodDto.builder()
                                                .serviceId(1)
                                                .name("Nhanh")
                                                .fee(baseFee.multiply(new BigDecimal("1.2")))
                                                .expectedDeliveryTime(leadTime != null ? leadTime - 43200 : null) // -12
                                                                                                                  // hours
                                                                                                                  // for
                                                                                                                  // express
                                                .build());
        }

        public OrderDetailResponseDTO getShipmentDetails(String orderCode) {
                if (orderCode == null || orderCode.isEmpty()) {
                        return null;
                }
                return ghnClient.getOrderDetail(orderCode);
        }

        public BigDecimal calculateShippingFee(OrderEntity order, Integer toDistrictId, String toWardCode) {
                return calculateShippingFee(order, toDistrictId, toWardCode, null);
        }

        public BigDecimal calculateShippingFee(OrderEntity order, Integer toDistrictId, String toWardCode,
                        Integer serviceId) {
                PickupLocation pickupLocation = resolvePickupLocation();
                Integer ghnServiceId = resolveStandardServiceId(pickupLocation.districtId(), toDistrictId);
                log.debug(
                                "Calculating GHN shipping fee: orderId={}, toDistrictId={}, toWardCode={}, fromDistrictId={}, fromWardCode={}, serviceId={}, ghnServiceId={}",
                                order != null ? order.getId() : null,
                                toDistrictId,
                                toWardCode,
                                pickupLocation.districtId(),
                                pickupLocation.wardCode(),
                                serviceId,
                                ghnServiceId);

                List<FeeRequestDTO.ItemDTO> items = order.getItems().stream()
                                .map(item -> FeeRequestDTO.ItemDTO.builder()
                                                .name(item.getProduct().getName())
                                                .quantity(item.getQuantity())
                                                .weight(DEFAULT_WEIGHT)
                                                .length(DEFAULT_LENGTH)
                                                .width(DEFAULT_WIDTH)
                                                .height(DEFAULT_HEIGHT)
                                                .build())
                                .collect(Collectors.toList());

                FeeRequestDTO request = FeeRequestDTO.builder()
                                .serviceTypeId(2) // Always 2 as requested
                                .serviceId(ghnServiceId)
                                .fromDistrictId(pickupLocation.districtId())
                                .fromWardCode(pickupLocation.wardCode())
                                .toDistrictId(toDistrictId)
                                .toWardCode(toWardCode)
                                .weight(DEFAULT_WEIGHT * order.getItems().size())
                                .length(DEFAULT_LENGTH)
                                .width(DEFAULT_WIDTH)
                                .height(DEFAULT_HEIGHT * order.getItems().size())
                                .insuranceValue(order.calculateItemsTotal().intValue())
                                .items(items)
                                .build();

                FeeResponseDTO response = ghnClient.calculateFee(request);
                BigDecimal fee = BigDecimal.valueOf(response.getTotal());

                if (serviceId != null) {
                        if (serviceId == 3)
                                return fee.multiply(new BigDecimal("0.8"));
                        if (serviceId == 1)
                                return fee.multiply(new BigDecimal("1.2"));
                }
                return fee;
        }


        public Long calculateLeadTime(Integer toDistrictId, String toWardCode, Integer serviceId) {
                if (toDistrictId == null || toWardCode == null || toWardCode.isEmpty()) {
                        log.warn("Cannot calculate leadtime: receiving location information is missing");
                        return null;
                }

                try {
                        PickupLocation pickupLocation = resolvePickupLocation();
                        Integer ghnServiceId = resolveStandardServiceId(pickupLocation.districtId(), toDistrictId);
                        log.debug(
                                        "Calculating GHN leadtime: toDistrictId={}, toWardCode={}, fromDistrictId={}, fromWardCode={}, serviceId={}, ghnServiceId={}",
                                        toDistrictId,
                                        toWardCode,
                                        pickupLocation.districtId(),
                                        pickupLocation.wardCode(),
                                        serviceId,
                                        ghnServiceId);

                        LeadTimeRequestDTO leadTimeRequest = LeadTimeRequestDTO.builder()
                                        .fromDistrictId(pickupLocation.districtId())
                                        .fromWardCode(pickupLocation.wardCode())
                                        .toDistrictId(toDistrictId)
                                        .toWardCode(toWardCode)
                                        .serviceId(ghnServiceId)
                                        .build();

                        LeadTimeResponseDTO leadTimeResponse = ghnClient.getLeadTime(leadTimeRequest);
                        if (leadTimeResponse == null || leadTimeResponse.getLeadtime() == null) {
                                log.warn("GHN leadtime response is empty for district {}", toDistrictId);
                                return null;
                        }

                        Long leadTime = leadTimeResponse.getLeadtime();

                        // Adjust based on internal serviceId (3: Tiet Kiem, 2: Tieu Chuan, 1: Nhanh)
                        if (serviceId != null) {
                                if (serviceId == 3)
                                        return leadTime + 86400; // +1 day
                                if (serviceId == 1)
                                        return leadTime - 43200; // -12 hours
                        }
                        return leadTime;
                } catch (Exception e) {
                        log.error("Error calculating leadtime from GHN for district {}: {}", toDistrictId,
                                        e.getMessage(), e);
                        return null;
                }
        }

        private Integer resolveStandardServiceId(Integer fromDistrictId, Integer toDistrictId) {
                List<AvailableServiceDTO> services = ghnClient.getAvailableServices(fromDistrictId, toDistrictId);
                if (services == null || services.isEmpty()) {
                        log.warn("No available services found from GHN for toDistrictId={} fromDistrictId={}",
                                        toDistrictId, fromDistrictId);
                        return null;
                }

                Integer ghnServiceId = services.stream()
                                .filter(s -> s.getServiceTypeId() == 2)
                                .map(AvailableServiceDTO::getServiceId)
                                .findFirst()
                                .orElse(null);

                if (ghnServiceId == null) {
                        log.warn("Standard service (type 2) not found in available services for district {}",
                                        toDistrictId);
                }
                return ghnServiceId;
        }

        public String createGHNShipment(OrderEntity order, Integer toDistrictId, String toWardCode,
                        String toAddress, String toName, String toPhone,
                        String toProvinceName, String toDistrictName, String toWardName) {
                PickupLocation pickupLocation = resolvePickupLocation();
                Integer ghnServiceId = resolveStandardServiceId(pickupLocation.districtId(), toDistrictId);

                List<ShipmentRequestDTO.ItemDTO> items = order.getItems().stream()
                                .map(item -> ShipmentRequestDTO.ItemDTO.builder()
                                                .name(item.getProduct().getName())
                                                .quantity(item.getQuantity())
                                                .price(item.getUnitPrice().intValue())
                                                .weight(DEFAULT_WEIGHT)
                                                .build())
                                .collect(Collectors.toList());

                ShipmentRequestDTO request = ShipmentRequestDTO.builder()
                                .paymentTypeId(1) // Người bán trả phí
                                .note("Giao thuốc online - SmartPharma")
                                .requiredNote("CHOXEMHANGKHONGTHU")
                                .returnPhone(ghnConfig.getReturnPhone())
                                .returnAddress(ghnConfig.getReturnAddress())
                                .toName(toName)
                                .toPhone(toPhone)
                                .toAddress(toAddress)
                                .toWardName(toWardName)
                                .toDistrictName(toDistrictName)
                                .toProvinceName(toProvinceName)
                                .toWardCode(toWardCode)
                                .toDistrictId(toDistrictId)
                                .codAmount(order.getPayment() != null
                                                && order.getPayment().getMethod() == com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod.COD
                                                        ? order.getFinalAmount().intValue()
                                                        : 0)
                                .content("Đơn hàng: " + order.getId())
                                .weight(DEFAULT_WEIGHT * order.getItems().size())
                                .length(DEFAULT_LENGTH)
                                .width(DEFAULT_WIDTH)
                                .height(DEFAULT_HEIGHT * order.getItems().size())
                                .serviceTypeId(2) // Always 2 as requested
                                .serviceId(ghnServiceId)
                                .items(items)
                                .build();

                ShipmentResponseDTO response = ghnClient.createShipment(request);

                if (response.getExpectedDeliveryTime() != null) {
                        try {
                                order.setExpectedDeliveryTime(
                                                java.time.OffsetDateTime.parse(response.getExpectedDeliveryTime())
                                                                .toEpochSecond());
                        } catch (Exception e) {
                                log.warn("Failed to parse expected delivery time from GHN create shipment: {}",
                                                response.getExpectedDeliveryTime());
                        }
                }

                return response.getOrderCode();
        }
}
