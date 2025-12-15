package com.nchuy099.SmartPharma.order.ghn;

import com.nchuy099.SmartPharma.order.ghn.dto.AvailableServiceDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.DistrictDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.FeeResponseDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.LeadTimeResponseDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.OrderDetailResponseDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.ProvinceDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.ShipmentResponseDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.ShopDTO;
import com.nchuy099.SmartPharma.order.ghn.dto.WardDTO;
import org.springframework.web.client.RestTemplate;

import java.util.List;

class MockGHNClient extends GHNClient {

    private static final int STANDARD_SERVICE_ID = 2;
    private static final int ECONOMY_SERVICE_ID = 3;
    private static final int EXPRESS_SERVICE_ID = 1;
    private static final int STANDARD_FEE = 30000;
    private static final long STANDARD_LEAD_TIME_SECONDS = 1_780_465_200L;

    MockGHNClient() {
        super((RestTemplate) null, (GHNConfig) null);
    }

    @Override
    public List<ProvinceDTO> getProvinces() {
        ProvinceDTO province = new ProvinceDTO();
        province.setProvinceId(1);
        province.setProvinceName("Mock Province");
        return List.of(province);
    }

    @Override
    public List<DistrictDTO> getDistricts(Integer provinceId) {
        if (provinceId == null) {
            return List.of();
        }
        DistrictDTO district = new DistrictDTO();
        district.setDistrictId(11);
        district.setProvinceId(provinceId);
        district.setDistrictName("Mock District");
        return List.of(district);
    }

    @Override
    public List<WardDTO> getWards(Integer districtId) {
        if (districtId == null) {
            return List.of();
        }
        WardDTO ward = new WardDTO();
        ward.setWardCode("00001");
        ward.setDistrictId(districtId);
        ward.setWardName("Mock Ward");
        return List.of(ward);
    }

    @Override
    public List<ShopDTO> getShops(int offset, int limit, String clientPhone) {
        ShopDTO shop = new ShopDTO();
        shop.setId(1);
        shop.setName("Mock GHN Shop");
        shop.setAddress("Mock address");
        shop.setDistrictId(11);
        shop.setWardCode("00001");
        return List.of(shop);
    }

    @Override
    public FeeResponseDTO calculateFee(com.nchuy099.SmartPharma.order.ghn.dto.FeeRequestDTO request) {
        FeeResponseDTO response = new FeeResponseDTO();
        response.setTotal(STANDARD_FEE);
        return response;
    }

    @Override
    public ShipmentResponseDTO createShipment(com.nchuy099.SmartPharma.order.ghn.dto.ShipmentRequestDTO request) {
        ShipmentResponseDTO response = new ShipmentResponseDTO();
        response.setOrderCode("MOCK_GHN_" + Math.abs(request.hashCode()));
        response.setExpectedDeliveryTime("2026-06-03T10:00:00+07:00");
        response.setTotalFee(STANDARD_FEE);
        return response;
    }

    @Override
    public List<AvailableServiceDTO> getAvailableServices(Integer fromDistrictId, Integer toDistrictId) {
        AvailableServiceDTO standard = new AvailableServiceDTO();
        standard.setServiceId(STANDARD_SERVICE_ID);
        standard.setServiceTypeId(2);
        standard.setShortName("Standard");

        AvailableServiceDTO economy = new AvailableServiceDTO();
        economy.setServiceId(ECONOMY_SERVICE_ID);
        economy.setServiceTypeId(2);
        economy.setShortName("Economy");

        AvailableServiceDTO express = new AvailableServiceDTO();
        express.setServiceId(EXPRESS_SERVICE_ID);
        express.setServiceTypeId(2);
        express.setShortName("Express");

        return List.of(standard, economy, express);
    }

    @Override
    public LeadTimeResponseDTO getLeadTime(com.nchuy099.SmartPharma.order.ghn.dto.LeadTimeRequestDTO request) {
        LeadTimeResponseDTO response = new LeadTimeResponseDTO();
        response.setLeadtime(STANDARD_LEAD_TIME_SECONDS);
        return response;
    }

    @Override
    public OrderDetailResponseDTO getOrderDetail(String orderCode) {
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
}
