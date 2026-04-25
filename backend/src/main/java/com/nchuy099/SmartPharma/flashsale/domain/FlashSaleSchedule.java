package com.nchuy099.SmartPharma.flashsale.domain;

import java.time.Instant;
import java.time.LocalDate;

public record FlashSaleSchedule(
        LocalDate campaignDate,
        FlashSaleSlot slot,
        Instant startAt,
        Instant endAt) {
}
