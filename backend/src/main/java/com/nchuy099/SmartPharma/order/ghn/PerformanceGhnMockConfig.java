package com.nchuy099.SmartPharma.order.ghn;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.beans.factory.annotation.Qualifier;

@Configuration
@Profile("performance")
public class PerformanceGhnMockConfig {

    @Bean
    @Primary
    public GHNClient mockGhnClient() {
        return new MockGHNClient();
    }

    @Bean
    @Primary
    public GHNService mockGhnService(@Qualifier("mockGhnClient") GHNClient ghnClient, GHNConfig ghnConfig) {
        return new MockGHNService(ghnClient, ghnConfig);
    }
}
