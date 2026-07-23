package com.nchuy099.SmartPharma.inventory.service;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryReservationExpiryJob {

    private final InventoryReservationService inventoryReservationService;

    @Scheduled(fixedDelayString = "${inventory.reservation.expiry-scan-ms:60000}")
    public void expireReservations() {
        for (var reservationId : inventoryReservationService.findExpiredReservationIds(Instant.now())) {
            try {
                inventoryReservationService.expireReservation(reservationId);
            } catch (Exception ex) {
                log.warn("Failed to expire inventory reservation {}", reservationId, ex);
            }
        }
    }
}
