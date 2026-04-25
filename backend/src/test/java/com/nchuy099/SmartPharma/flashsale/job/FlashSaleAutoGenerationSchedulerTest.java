package com.nchuy099.SmartPharma.flashsale.job;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleCampaignResponse;
import com.nchuy099.SmartPharma.flashsale.service.FlashSaleAutoGenerationService;

class FlashSaleAutoGenerationSchedulerTest {

    private FlashSaleAutoGenerationService flashSaleAutoGenerationService;
    private FlashSaleAutoGenerationScheduler scheduler;

    @BeforeEach
    void setUp() {
        flashSaleAutoGenerationService = mock(FlashSaleAutoGenerationService.class);
        scheduler = new FlashSaleAutoGenerationScheduler(flashSaleAutoGenerationService);
        ReflectionTestUtils.setField(scheduler, "zoneId", "Asia/Ho_Chi_Minh");
    }

    @Test
    void generateDailyFlashSaleShouldCallServiceWhenEnabled() {
        ReflectionTestUtils.setField(scheduler, "enabled", true);
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDate today = LocalDate.now(zone);
        when(flashSaleAutoGenerationService.generateForDate(today, zone)).thenReturn(Optional.of(
                FlashSaleCampaignResponse.builder().id("id").code("AUTO-FS-20260617").items(java.util.List.of()).build()));

        scheduler.generateDailyFlashSale();

        verify(flashSaleAutoGenerationService).generateForDate(today, zone);
    }

    @Test
    void generateDailyFlashSaleShouldNoOpWhenDisabled() {
        ReflectionTestUtils.setField(scheduler, "enabled", false);

        scheduler.generateDailyFlashSale();

        verifyNoInteractions(flashSaleAutoGenerationService);
    }
}
