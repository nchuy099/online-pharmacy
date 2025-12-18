package com.nchuy099.SmartPharma.order.ghn;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderItemEntity;
import com.nchuy099.SmartPharma.order.ghn.dto.AvailableServiceDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.FeeResponseDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.FeeRequestDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.LeadTimeRequestDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.LeadTimeResponseDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.ShipmentRequestDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.ShipmentResponseDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.ShopDTO;

class GHNServiceTest {
    private GHNClient ghnClient;
    private GHNConfig ghnConfig;
    private GHNService ghnService;

    @BeforeEach
    void setUp() {
        ghnClient = mock(GHNClient.class);
        ghnConfig = mock(GHNConfig.class);
        ghnService = new GHNService(ghnClient, ghnConfig);
    }

    @Test
    void calculateLeadTimeShouldUseMatchedShopPickupLocation() {
        ShopDTO shop = new ShopDTO();
        shop.setId(72359);
        shop.setDistrictId(1455);
        shop.setWardCode("21410");
        shop.setName("Kinh doanh Corgi");
        shop.setAddress("3 Dong Den");

        AvailableServiceDTO availableService = new AvailableServiceDTO();
        availableService.setServiceId(999);
        availableService.setServiceTypeId(2);

        LeadTimeResponseDTO leadTimeResponse = new LeadTimeResponseDTO();
        leadTimeResponse.setLeadtime(1_725_876_000L);

        when(ghnConfig.getShopId()).thenReturn("72359");
        when(ghnConfig.getFromDistrictId()).thenReturn(9999);
        when(ghnConfig.getFromWardCode()).thenReturn("FALLBACK");
        when(ghnClient.getShops(0, 200, "")).thenReturn(List.of(shop));
        when(ghnClient.getAvailableServices(1455, 1484)).thenReturn(List.of(availableService));
        when(ghnClient.getLeadTime(any(LeadTimeRequestDTO.class))).thenReturn(leadTimeResponse);

        Long leadTime = ghnService.calculateLeadTime(1484, "WARD-A", 2);

        assertEquals(1_725_876_000L, leadTime);
        verify(ghnClient).getAvailableServices(1455, 1484);
        verify(ghnClient).getLeadTime(org.mockito.ArgumentMatchers.argThat(request ->
                request != null
                        && Integer.valueOf(1455).equals(request.getFromDistrictId())
                        && "21410".equals(request.getFromWardCode())
                        && Integer.valueOf(999).equals(request.getServiceId())));
    }

    @Test
    void calculateShippingFeeShouldUseMatchedShopPickupLocation() {
        ShopDTO shop = new ShopDTO();
        shop.setId(72359);
        shop.setDistrictId(1455);
        shop.setWardCode("21410");
        shop.setName("Kinh doanh Corgi");

        AvailableServiceDTO availableService = new AvailableServiceDTO();
        availableService.setServiceId(999);
        availableService.setServiceTypeId(2);

        FeeResponseDTO feeResponse = new FeeResponseDTO();
        feeResponse.setTotal(18000);

        OrderEntity order = new OrderEntity();
        order.setItems(new ArrayList<OrderItemEntity>());

        when(ghnConfig.getShopId()).thenReturn("72359");
        when(ghnClient.getShops(0, 200, "")).thenReturn(List.of(shop));
        when(ghnClient.getAvailableServices(1455, 1484)).thenReturn(List.of(availableService));
        when(ghnClient.calculateFee(any(FeeRequestDTO.class))).thenReturn(feeResponse);

        BigDecimal fee = ghnService.calculateShippingFee(order, 1484, "WARD-A", null);

        assertEquals(new BigDecimal("18000"), fee);
        verify(ghnClient).calculateFee(org.mockito.ArgumentMatchers.argThat(request ->
                request != null
                        && Integer.valueOf(1455).equals(request.getFromDistrictId())
                        && "21410".equals(request.getFromWardCode())
                        && Integer.valueOf(1484).equals(request.getToDistrictId())
                        && Integer.valueOf(999).equals(request.getServiceId())));
    }

    @Test
    void createGHNShipmentShouldUseResolvedStandardServiceId() {
        ShopDTO shop = new ShopDTO();
        shop.setId(72359);
        shop.setDistrictId(1455);
        shop.setWardCode("21410");

        AvailableServiceDTO availableService = new AvailableServiceDTO();
        availableService.setServiceId(999);
        availableService.setServiceTypeId(2);

        ShipmentResponseDTO shipmentResponse = new ShipmentResponseDTO();
        shipmentResponse.setOrderCode("GHN123");

        OrderEntity order = new OrderEntity();
        order.setItems(new ArrayList<>());
        order.setFinalAmount(new BigDecimal("150000"));

        when(ghnConfig.getShopId()).thenReturn("72359");
        when(ghnClient.getShops(0, 200, "")).thenReturn(List.of(shop));
        when(ghnClient.getAvailableServices(1455, 1484)).thenReturn(List.of(availableService));
        when(ghnClient.createShipment(any(ShipmentRequestDTO.class))).thenReturn(shipmentResponse);

        String orderCode = ghnService.createGHNShipment(
                order,
                1484,
                "WARD-A",
                "12 Nguyen Trai",
                "Nguyen Van A",
                "0900000000",
                "Ho Chi Minh",
                "Quan 1",
                "Ben Nghe");

        assertEquals("GHN123", orderCode);
        verify(ghnClient).createShipment(org.mockito.ArgumentMatchers.argThat(request ->
                request != null
                        && Integer.valueOf(1484).equals(request.getToDistrictId())
                        && "WARD-A".equals(request.getToWardCode())
                        && Integer.valueOf(999).equals(request.getServiceId())));
    }
}
