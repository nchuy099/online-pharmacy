package com.nchuy099.SmartPharma.inventory.service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryLotStatus;
import com.nchuy099.SmartPharma.inventory.entity.InventorySummaryEntity;
import com.nchuy099.SmartPharma.inventory.repository.InventoryLotRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventorySummaryRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventorySummarySyncService {

    private static final List<InventoryLotStatus> SUMMARY_STATUSES = List.of(
            InventoryLotStatus.ACTIVE,
            InventoryLotStatus.BLOCKED,
            InventoryLotStatus.DEPLETED);

    private final InventoryLotRepository inventoryLotRepository;
    private final InventorySummaryRepository inventorySummaryRepository;

    public InventorySummarySyncService(
            InventoryLotRepository inventoryLotRepository,
            InventorySummaryRepository inventorySummaryRepository) {
        this.inventoryLotRepository = inventoryLotRepository;
        this.inventorySummaryRepository = inventorySummaryRepository;
    }

    @Transactional
    public InventorySummaryEntity sync(UUID variantId) {
        InventorySummaryEntity summary = inventorySummaryRepository.findByVariantId(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Inventory summary not found"));
        int onHand = inventoryLotRepository.sumOnHandByVariant(variantId, SUMMARY_STATUSES);
        int reserved = inventoryLotRepository.sumReservedByVariant(variantId, SUMMARY_STATUSES);
        summary.syncFromLots(onHand, reserved);
        return inventorySummaryRepository.save(summary);
    }
}
