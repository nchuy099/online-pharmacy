package com.nchuy099.SmartPharma.order.ghn;

import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.dto.response.PreviewResponse;
import com.nchuy099.SmartPharma.order.ghn.dto.OrderDetailResponseDTO;

import java.math.BigDecimal;
import java.util.List;

class MockGHNService extends GHNService {

    private static final long STANDARD_LEAD_TIME_SECONDS = 1_780_465_200L;
    private static final BigDecimal STANDARD_FEE = new BigDecimal("30000");

    MockGHNService(GHNClient ghnClient, GHNConfig ghnConfig) {
        super(ghnClient, ghnConfig);
    }

    @Override
    public List<PreviewResponse.ShippingMethodDto> getAvailableShippingMethods(OrderEntity order, Integer toDistrictId, String toWardCode) {
        return List.of(
                PreviewResponse.ShippingMethodDto.builder()
                        .serviceId(3)
                        .name("Tiết kiệm")
                        .fee(STANDARD_FEE.multiply(new BigDecimal("0.8")))
                        .expectedDeliveryTime(STANDARD_LEAD_TIME_SECONDS + 86400)
                        .build(),
                PreviewResponse.ShippingMethodDto.builder()
                        .serviceId(2)
                        .name("Tiêu chuẩn")
                        .fee(STANDARD_FEE)
                        .expectedDeliveryTime(STANDARD_LEAD_TIME_SECONDS)
                        .build(),
                PreviewResponse.ShippingMethodDto.builder()
                        .serviceId(1)
                        .name("Nhanh")
                        .fee(STANDARD_FEE.multiply(new BigDecimal("1.2")))
                        .expectedDeliveryTime(STANDARD_LEAD_TIME_SECONDS - 43200)
                        .build()
        );
    }

    @Override
    public OrderDetailResponseDTO getShipmentDetails(String orderCode) {
        if (orderCode == null || orderCode.isBlank()) {
            return null;
        }

        OrderDetailResponseDTO response = new OrderDetailResponseDTO();
        response.setOrderCode(orderCode);
        response.setStatus("delivering");
        response.setFromName("Mock GHN Shop");
        response.setFromPhone("0900000000");
        response.setFromAddress("Mock address");
        response.setToName("Mock Customer");
        response.setToPhone("0900000001");
        response.setToAddress("Mock delivery address");
        response.setWeight(200);
        response.setLeadtime("2026-06-03T10:00:00+07:00");

        OrderDetailResponseDTO.LogEntryDTO logEntry = new OrderDetailResponseDTO.LogEntryDTO();
        logEntry.setStatus("delivering");
        logEntry.setUpdatedDate("2026-06-01T10:00:00+07:00");
        response.setLog(List.of(logEntry));
        return response;
    }

    @Override
    public BigDecimal calculateShippingFee(OrderEntity order, Integer toDistrictId, String toWardCode, Integer serviceId) {
        if (serviceId != null) {
            if (serviceId == 3) {
                return STANDARD_FEE.multiply(new BigDecimal("0.8"));
            }
            if (serviceId == 1) {
                return STANDARD_FEE.multiply(new BigDecimal("1.2"));
            }
        }
        return STANDARD_FEE;
    }

    @Override
    public Long calculateLeadTime(Integer toDistrictId, String toWardCode, Integer serviceId) {
        if (serviceId != null) {
            if (serviceId == 3) {
                return STANDARD_LEAD_TIME_SECONDS + 86400;
            }
            if (serviceId == 1) {
                return STANDARD_LEAD_TIME_SECONDS - 43200;
            }
        }
        return STANDARD_LEAD_TIME_SECONDS;
    }

    @Override
    public String createGHNShipment(OrderEntity order, Integer toDistrictId, String toWardCode, String toAddress, String toName, String toPhone, String toProvinceName, String toDistrictName, String toWardName) {
        String orderCode = order != null && order.getOrderCode() != null ? order.getOrderCode() : "UNKNOWN";
        return "MOCK_GHN_" + orderCode;
    }
}
