package com.nchuy099.SmartPharma.order.infrastructure.shipping;

import java.util.List;

import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.dto.response.PreviewResponse;
import com.nchuy099.SmartPharma.order.ghn.GHNService;
import com.nchuy099.SmartPharma.order.ghn.dto.OrderDetailResponseDTO;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class GhnShippingAdapter implements ShippingProvider {

    private final GHNService ghnService;

    @Override
    public List<PreviewResponse.ShippingMethodDto> getAvailableShippingMethods(OrderEntity order, Integer toDistrictId,
            String toWardCode) {
        return ghnService.getAvailableShippingMethods(order, toDistrictId, toWardCode);
    }

    @Override
    public OrderDetailResponseDTO getShipmentDetails(String orderCode) {
        return ghnService.getShipmentDetails(orderCode);
    }

    @Override
    public String createShipment(OrderEntity order, Integer toDistrictId, String toWardCode, String toAddress,
            String toName, String toPhone, String provinceName, String districtName, String wardName) {
        return ghnService.createGHNShipment(order, toDistrictId, toWardCode, toAddress, toName, toPhone, provinceName,
                districtName, wardName);
    }
}
