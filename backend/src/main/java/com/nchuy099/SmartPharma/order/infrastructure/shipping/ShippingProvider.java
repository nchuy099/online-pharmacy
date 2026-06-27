package com.nchuy099.SmartPharma.order.infrastructure.shipping;

import java.util.List;

import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.dto.response.PreviewResponse;
import com.nchuy099.SmartPharma.order.ghn.dto.OrderDetailResponseDTO;

public interface ShippingProvider {

    List<PreviewResponse.ShippingMethodDto> getAvailableShippingMethods(OrderEntity order, Integer toDistrictId,
            String toWardCode);

    OrderDetailResponseDTO getShipmentDetails(String orderCode);

    String createShipment(OrderEntity order, Integer toDistrictId, String toWardCode, String toAddress, String toName,
            String toPhone, String provinceName, String districtName, String wardName);
}
