package com.nchuy099.SmartPharma.flashsale.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleSchedule;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleSlot;

@Component
public class FlashSaleSlotResolver {

    private final ZoneId zoneId;

    public FlashSaleSlotResolver(@Value("${flash-sale.auto-generation.zone-id:Asia/Ho_Chi_Minh}") String zoneId) {
        this.zoneId = ZoneId.of(zoneId);
    }

    public FlashSaleSchedule resolve(LocalDate campaignDate, FlashSaleSlot slot) {
        if (campaignDate == null || slot == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Campaign date and slot are required");
        }

        Instant startAt = campaignDate.atTime(slot.getStartTime()).atZone(zoneId).toInstant();
        Instant endAt = campaignDate.atTime(slot.getEndTime()).atZone(zoneId).toInstant();
        return new FlashSaleSchedule(campaignDate, slot, startAt, endAt);
    }

    public LocalDate resolveCampaignDate(Instant startAt) {
        return startAt.atZone(zoneId).toLocalDate();
    }

    public FlashSaleSlot resolveSlot(Instant startAt, Instant endAt) {
        if (startAt == null || endAt == null) {
            return null;
        }
        var localStart = startAt.atZone(zoneId).toLocalTime();
        var localEnd = endAt.atZone(zoneId).toLocalTime();
        for (FlashSaleSlot slot : FlashSaleSlot.values()) {
            if (slot.getStartTime().equals(localStart) && slot.getEndTime().equals(localEnd)) {
                return slot;
            }
        }
        return null;
    }
}
