package com.nchuy099.SmartPharma.order.ghn;

import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.dto.response.PreviewResponse;
import com.nchuy099.SmartPharma.order.ghn.dto.OrderDetailResponseDTO;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class MockGHNServiceTest {

    private final MockGHNService service = new MockGHNService(new MockGHNClient(), null);

    @Test
    void returnsStableShippingMethods() {
        var methods = service.getAvailableShippingMethods(null, 11, "00001");

        assertEquals(3, methods.size());
        assertEquals(3, methods.get(0).getServiceId());
        assertEquals(new BigDecimal("24000.0"), methods.get(0).getFee());
        assertEquals(2, methods.get(1).getServiceId());
        assertEquals(new BigDecimal("30000"), methods.get(1).getFee());
        assertEquals(1, methods.get(2).getServiceId());
        assertEquals(new BigDecimal("36000.0"), methods.get(2).getFee());
    }

    @Test
    void returnsStableShipmentDetails() {
        OrderDetailResponseDTO detail = service.getShipmentDetails("MOCK_GHN_123");

        assertNotNull(detail);
        assertEquals("MOCK_GHN_123", detail.getOrderCode());
        assertEquals("delivering", detail.getStatus());
        assertNotNull(detail.getLog());
        assertFalse(detail.getLog().isEmpty());
    }

    @Test
    void createsStableShipmentCode() {
        assertEquals("MOCK_GHN_UNKNOWN", service.createGHNShipment(null, 11, "00001", null, null, null, null, null, null));
    }

    @Test
    void returnsStableLeadTimeAndFees() {
        assertEquals(new BigDecimal("30000"), service.calculateShippingFee(null, 11, "00001", null));
        assertEquals(new BigDecimal("24000.0"), service.calculateShippingFee(null, 11, "00001", 3));
        assertEquals(new BigDecimal("36000.0"), service.calculateShippingFee(null, 11, "00001", 1));

        assertEquals(1_780_465_200L, service.calculateLeadTime(11, "00001", null));
        assertEquals(1_780_551_600L, service.calculateLeadTime(11, "00001", 3));
        assertEquals(1_780_422_000L, service.calculateLeadTime(11, "00001", 1));
    }
}
