package com.nchuy099.SmartPharma.flashsale.job;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleCampaignResponse;
import com.nchuy099.SmartPharma.flashsale.service.FlashSaleAutoGenerationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class FlashSaleAutoGenerationScheduler {

    private final FlashSaleAutoGenerationService flashSaleAutoGenerationService;

    @Value("${flash-sale.auto-generation.enabled:true}")
    private boolean enabled;

    @Value("${flash-sale.auto-generation.zone-id:Asia/Ho_Chi_Minh}")
    private String zoneId;

    @Scheduled(cron = "${flash-sale.auto-generation.cron:0 5 0 * * *}", zone = "${flash-sale.auto-generation.zone-id:Asia/Ho_Chi_Minh}")
    public void generateDailyFlashSale() {
        if (!enabled) {
            return;
        }

        ZoneId zone = ZoneId.of(zoneId);
        LocalDate today = LocalDate.now(zone);
        Optional<FlashSaleCampaignResponse> campaign = flashSaleAutoGenerationService.generateForDate(today, zone);
        campaign.ifPresent(result -> log.info("Auto flash sale campaign {} is ready with {} items", result.getCode(), result.getItems().size()));
    }
}
