package com.nchuy099.SmartPharma.inventory.service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.inventory.entity.InventoryLotEntity;
import com.nchuy099.SmartPharma.inventory.model.ReservationAllocation;
import com.nchuy099.SmartPharma.inventory.repository.InventoryLotRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryAllocationDomainService {

    private final InventoryLotRepository inventoryLotRepository;

    public InventoryAllocationDomainService(InventoryLotRepository inventoryLotRepository) {
        this.inventoryLotRepository = inventoryLotRepository;
    }

    @Transactional
    public List<ReservationAllocation> reserveByFefo(UUID variantId, int requiredQuantity) {
        if (requiredQuantity <= 0) {
            throw new AppException(ErrorCode.CONFLICT, "Quantity must be > 0");
        }

        List<InventoryLotEntity> lots = inventoryLotRepository.findSellableLotsForFefo(variantId);
        int remaining = requiredQuantity;
        List<ReservationAllocation> allocations = new ArrayList<>();

        for (InventoryLotEntity lot : lots) {
            if (remaining <= 0) {
                break;
            }
            int allocated = Math.min(lot.getQuantityAvailable(), remaining);
            if (allocated <= 0) {
                continue;
            }
            int updated = inventoryLotRepository.reserveLot(lot.getId(), allocated);
            if (updated == 1) {
                allocations.add(new ReservationAllocation(
                        lot.getId(),
                        allocated,
                        lot.getUnitCost() != null ? lot.getUnitCost() : BigDecimal.ZERO));
                remaining -= allocated;
            }
        }

        if (remaining > 0) {
            throw new AppException(ErrorCode.CONFLICT, "Not enough stock to reserve");
        }

        return allocations;
    }

    @Transactional
    public void releaseAllocations(List<ReservationAllocation> allocations) {
        for (ReservationAllocation allocation : allocations) {
            int updated = inventoryLotRepository.releaseLot(allocation.lotId(), allocation.quantity());
            if (updated != 1) {
                throw new AppException(ErrorCode.CONFLICT, "Failed to release reserved inventory lot");
            }
        }
    }

    @Transactional
    public void exportAllocations(List<ReservationAllocation> allocations) {
        for (ReservationAllocation allocation : allocations) {
            int updated = inventoryLotRepository.exportReservedLot(allocation.lotId(), allocation.quantity());
            if (updated != 1) {
                throw new AppException(ErrorCode.CONFLICT, "Failed to export reserved inventory lot");
            }
        }
    }
}
