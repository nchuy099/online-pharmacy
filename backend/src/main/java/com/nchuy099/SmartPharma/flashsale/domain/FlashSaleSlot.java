package com.nchuy099.SmartPharma.flashsale.domain;

import java.time.LocalTime;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FlashSaleSlot {
    MORNING_09_11("09:00 - 11:00", LocalTime.of(9, 0), LocalTime.of(11, 0)),
    NOON_11_13("11:00 - 13:00", LocalTime.of(11, 0), LocalTime.of(13, 0)),
    AFTERNOON_14_16("14:00 - 16:00", LocalTime.of(14, 0), LocalTime.of(16, 0)),
    EVENING_19_21("19:00 - 21:00", LocalTime.of(19, 0), LocalTime.of(21, 0));

    private final String label;
    private final LocalTime startTime;
    private final LocalTime endTime;
}
