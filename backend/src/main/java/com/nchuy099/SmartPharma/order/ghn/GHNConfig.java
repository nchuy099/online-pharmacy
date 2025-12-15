package com.nchuy099.SmartPharma.order.ghn;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
@ConfigurationProperties(prefix = "ghn")
@Getter
@Setter
@Slf4j
public class GHNConfig {
    private String token;
    private String baseUrl;
    private String shopId;
    private Integer fromDistrictId;
    private String fromWardCode;
    private String returnPhone;
    private String returnAddress;

    @PostConstruct
    void logLoadedConfig() {
        log.info(
                "Loaded GHN config: baseUrl={}, shopId={}, fromDistrictId={}, fromWardCode={}, returnPhone={}, returnAddress={}",
                baseUrl,
                shopId,
                fromDistrictId,
                fromWardCode,
                returnPhone,
                returnAddress);
    }
}
