package com.nchuy099.SmartPharma.order.ghn;

import com.nchuy099.SmartPharma.order.ghn.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class GHNClient {
    private final RestTemplate restTemplate;
    private final GHNConfig ghnConfig;

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", ghnConfig.getToken());
        if (ghnConfig.getShopId() != null) {
            headers.set("ShopId", ghnConfig.getShopId());
        }
        return headers;
    }

    public List<ProvinceDTO> getProvinces() {
        String url = ghnConfig.getBaseUrl() + "master-data/province";
        HttpEntity<Void> entity = new HttpEntity<>(createHeaders());

        ResponseEntity<GHNResponse<List<ProvinceDTO>>> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, new ParameterizedTypeReference<GHNResponse<List<ProvinceDTO>>>() {
                });

        GHNResponse<List<ProvinceDTO>> ghnResponse = response.getBody();
        if (ghnResponse == null || ghnResponse.getData() == null) {
            log.error("GHN getProvinces returned null body or data. Message: {}",
                    ghnResponse != null ? ghnResponse.getMessage() : "null");
            return List.of();
        }
        return ghnResponse.getData();
    }

    public List<DistrictDTO> getDistricts(Integer provinceId) {
        String url = ghnConfig.getBaseUrl() + "master-data/district";
        Map<String, Integer> body = Map.of("province_id", provinceId);
        HttpEntity<Map<String, Integer>> entity = new HttpEntity<>(body, createHeaders());

        ResponseEntity<GHNResponse<List<DistrictDTO>>> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, new ParameterizedTypeReference<GHNResponse<List<DistrictDTO>>>() {
                });

        GHNResponse<List<DistrictDTO>> ghnResponse = response.getBody();
        if (ghnResponse == null || ghnResponse.getData() == null) {
            log.error("GHN getDistricts for province {} returned null body or data. Message: {}", provinceId,
                    ghnResponse != null ? ghnResponse.getMessage() : "null");
            return List.of();
        }
        return ghnResponse.getData();
    }

    public List<WardDTO> getWards(Integer districtId) {
        String url = ghnConfig.getBaseUrl() + "master-data/ward?district_id=" + districtId;
        Map<String, Integer> body = Map.of("district_id", districtId);
        HttpEntity<Map<String, Integer>> entity = new HttpEntity<>(body, createHeaders());

        ResponseEntity<GHNResponse<List<WardDTO>>> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, new ParameterizedTypeReference<GHNResponse<List<WardDTO>>>() {
                });

        GHNResponse<List<WardDTO>> ghnResponse = response.getBody();
        if (ghnResponse == null || ghnResponse.getData() == null) {
            log.error("GHN getWards for district {} returned null body or data. Message: {}", districtId,
                    ghnResponse != null ? ghnResponse.getMessage() : "null");
            return List.of();
        }
        return ghnResponse.getData();
    }

    public List<ShopDTO> getShops(int offset, int limit, String clientPhone) {
        String url = ghnConfig.getBaseUrl() + "v2/shop/all";
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("offset", offset);
        body.put("limit", limit);
        body.put("client_phone", clientPhone == null ? "" : clientPhone);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders());

        ResponseEntity<GHNResponse<ShopListResponseDTO>> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, new ParameterizedTypeReference<GHNResponse<ShopListResponseDTO>>() {
                });

        GHNResponse<ShopListResponseDTO> ghnResponse = response.getBody();
        if (ghnResponse == null || ghnResponse.getData() == null) {
            log.error("GHN getShops returned null body or data. Message: {}",
                    ghnResponse != null ? ghnResponse.getMessage() : "null");
            return List.of();
        }

        List<ShopDTO> shops = ghnResponse.getData().getShops();
        if (shops == null) {
            log.warn("GHN getShops returned empty shops list. Message: {}", ghnResponse.getMessage());
            return List.of();
        }

        return shops;
    }

    public FeeResponseDTO calculateFee(FeeRequestDTO request) {
        String url = ghnConfig.getBaseUrl() + "v2/shipping-order/fee";
        HttpEntity<FeeRequestDTO> entity = new HttpEntity<>(request, createHeaders());

        ResponseEntity<GHNResponse<FeeResponseDTO>> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, new ParameterizedTypeReference<GHNResponse<FeeResponseDTO>>() {
                });

        GHNResponse<FeeResponseDTO> ghnResponse = response.getBody();
        if (ghnResponse == null || ghnResponse.getData() == null) {
            log.error("GHN calculateFee returned null body or data. Message: {}",
                    ghnResponse != null ? ghnResponse.getMessage() : "null");
            throw new RuntimeException("Failed to calculate shipping fee from GHN");
        }
        return ghnResponse.getData();
    }

    public ShipmentResponseDTO createShipment(ShipmentRequestDTO request) {
        String url = ghnConfig.getBaseUrl() + "v2/shipping-order/create";
        HttpEntity<ShipmentRequestDTO> entity = new HttpEntity<>(request, createHeaders());

        ResponseEntity<GHNResponse<ShipmentResponseDTO>> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, new ParameterizedTypeReference<GHNResponse<ShipmentResponseDTO>>() {
                });

        GHNResponse<ShipmentResponseDTO> ghnResponse = response.getBody();
        if (ghnResponse == null || ghnResponse.getData() == null) {
            log.error("GHN createShipment returned null body or data. Message: {}",
                    ghnResponse != null ? ghnResponse.getMessage() : "null");
            throw new RuntimeException("Failed to create shipment on GHN");
        }
        return ghnResponse.getData();
    }

    public List<AvailableServiceDTO> getAvailableServices(Integer fromDistrictId, Integer toDistrictId) {
        if (fromDistrictId == null || toDistrictId == null) {
            log.warn("Cannot fetch available services: district ID is null (From: {}, To: {})", fromDistrictId,
                    toDistrictId);
            return List.of();
        }
        String url = ghnConfig.getBaseUrl() + "v2/shipping-order/available-services";
        java.util.Map<String, Object> body = new java.util.HashMap<>();
        try {
            if (ghnConfig.getShopId() != null && !ghnConfig.getShopId().isEmpty()) {
                body.put("shop_id", Integer.parseInt(ghnConfig.getShopId()));
            }
        } catch (NumberFormatException e) {
            log.warn("Invalid ShopId format: {}", ghnConfig.getShopId());
        }
        body.put("from_district", fromDistrictId);
        body.put("to_district", toDistrictId);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders());

        try {
            ResponseEntity<GHNResponse<List<AvailableServiceDTO>>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity,
                    new ParameterizedTypeReference<GHNResponse<List<AvailableServiceDTO>>>() {
                    });

            GHNResponse<List<AvailableServiceDTO>> ghnResponse = response.getBody();
            if (ghnResponse == null || ghnResponse.getData() == null) {
                log.warn("GHN available-services returned null body or data for district {}. Message: {}", toDistrictId,
                        ghnResponse != null ? ghnResponse.getMessage() : "null");
                return List.of();
            }
            return ghnResponse.getData();
        } catch (Exception e) {
            log.error("Failed to fetch available services from GHN for district {}: {}", toDistrictId, e.getMessage());
            return List.of();
        }
    }

    public LeadTimeResponseDTO getLeadTime(LeadTimeRequestDTO request) {
        String url = ghnConfig.getBaseUrl() + "v2/shipping-order/leadtime";
        HttpEntity<LeadTimeRequestDTO> entity = new HttpEntity<>(request, createHeaders());

        ResponseEntity<GHNResponse<LeadTimeResponseDTO>> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, new ParameterizedTypeReference<GHNResponse<LeadTimeResponseDTO>>() {
                });

        GHNResponse<LeadTimeResponseDTO> ghnResponse = response.getBody();
        if (ghnResponse == null || ghnResponse.getData() == null) {
            log.error("GHN getLeadTime returned null body or data. Message: {}",
                    ghnResponse != null ? ghnResponse.getMessage() : "null");
            return null;
        }
        return ghnResponse.getData();
    }

    public OrderDetailResponseDTO getOrderDetail(String orderCode) {
        String url = ghnConfig.getBaseUrl() + "v2/shipping-order/detail";
        OrderDetailRequestDTO request = OrderDetailRequestDTO.builder().orderCode(orderCode).build();
        HttpEntity<OrderDetailRequestDTO> entity = new HttpEntity<>(request, createHeaders());

        ResponseEntity<GHNResponse<OrderDetailResponseDTO>> response = restTemplate.exchange(
                url, HttpMethod.POST, entity,
                new ParameterizedTypeReference<GHNResponse<OrderDetailResponseDTO>>() {
                });

        GHNResponse<OrderDetailResponseDTO> ghnResponse = response.getBody();
        if (ghnResponse == null || ghnResponse.getData() == null) {
            log.error("GHN getOrderDetail for {} returned null body or data. Message: {}", orderCode,
                    ghnResponse != null ? ghnResponse.getMessage() : "null");
            return null;
        }
        return ghnResponse.getData();
    }
}
