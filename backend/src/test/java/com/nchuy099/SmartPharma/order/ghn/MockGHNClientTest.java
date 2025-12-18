package com.nchuy099.SmartPharma.order.ghn;

import com.nchuy099.SmartPharma.order.ghn.dto.DistrictDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.ProvinceDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.WardDTO;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MockGHNClientTest {

    private final MockGHNClient client = new MockGHNClient();

    @Test
    void returnsDeterministicLocationData() {
        assertEquals(1, client.getProvinces().size());

        ProvinceDTO province = client.getProvinces().get(0);
        assertEquals(1, province.getProvinceId());
        assertEquals("Mock Province", province.getProvinceName());

        assertEquals(1, client.getDistricts(province.getProvinceId()).size());
        DistrictDTO district = client.getDistricts(province.getProvinceId()).get(0);
        assertEquals(11, district.getDistrictId());
        assertEquals("Mock District", district.getDistrictName());

        assertEquals(1, client.getWards(district.getDistrictId()).size());
        WardDTO ward = client.getWards(district.getDistrictId()).get(0);
        assertEquals("00001", ward.getWardCode());
        assertEquals("Mock Ward", ward.getWardName());
    }
}
