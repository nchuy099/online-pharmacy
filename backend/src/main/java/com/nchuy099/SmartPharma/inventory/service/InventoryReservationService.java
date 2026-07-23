package com.nchuy099.SmartPharma.inventory.service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryReferenceType;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryReservationStatus;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryReservationType;
import com.nchuy099.SmartPharma.inventory.entity.InventoryReservationEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventoryReservationItemEntity;
import com.nchuy099.SmartPharma.inventory.model.ReservationAllocation;
import com.nchuy099.SmartPharma.inventory.repository.InventoryLotRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventoryReservationItemRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventoryReservationRepository;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderItemEntity;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class InventoryReservationService {

    private final InventoryCommandService inventoryCommandService;
    private final InventoryLotRepository inventoryLotRepository;
    private final InventoryReservationRepository inventoryReservationRepository;
    private final InventoryReservationItemRepository inventoryReservationItemRepository;
    private final long pendingPaymentTimeoutSeconds;
    private final long codConfirmationTimeoutSeconds;
    private final long flashSaleReservationTtlSeconds;

    public InventoryReservationService(
            InventoryCommandService inventoryCommandService,
            InventoryLotRepository inventoryLotRepository,
            InventoryReservationRepository inventoryReservationRepository,
            InventoryReservationItemRepository inventoryReservationItemRepository,
            @Value("${order.auto-cancel.pending-payment-timeout-seconds:600}") long pendingPaymentTimeoutSeconds,
            @Value("${order.cod-confirmation-timeout-seconds:86400}") long codConfirmationTimeoutSeconds,
            @Value("${flash-sale.reservation-ttl-seconds:300}") long flashSaleReservationTtlSeconds) {
        this.inventoryCommandService = inventoryCommandService;
        this.inventoryLotRepository = inventoryLotRepository;
        this.inventoryReservationRepository = inventoryReservationRepository;
        this.inventoryReservationItemRepository = inventoryReservationItemRepository;
        this.pendingPaymentTimeoutSeconds = pendingPaymentTimeoutSeconds;
        this.codConfirmationTimeoutSeconds = codConfirmationTimeoutSeconds;
        this.flashSaleReservationTtlSeconds = flashSaleReservationTtlSeconds;
    }

    @Transactional
    public InventoryReservationEntity reserveOrder(OrderEntity order, UUID createdBy) {
        if (order == null || order.getId() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Order is required before reserving inventory");
        }
        if (inventoryReservationRepository.findByOrderId(order.getId()).isPresent()) {
            throw new AppException(ErrorCode.CONFLICT, "Order already has an inventory reservation");
        }

        InventoryReservationEntity reservation = InventoryReservationEntity.builder()
                .reservationKey("ORDER:" + order.getId())
                .order(order)
                .reservationType(order.getFlashSaleReservationId() != null
                        ? InventoryReservationType.FLASH_SALE
                        : InventoryReservationType.ORDER)
                .status(InventoryReservationStatus.PENDING)
                .expiresAt(resolveExpiresAt(order))
                .build();
        inventoryReservationRepository.save(reservation);

        for (OrderItemEntity item : order.getItems()) {
            List<ReservationAllocation> allocations = inventoryCommandService.reserveStock(
                    item.getVariant().getId(),
                    item.getQuantity(),
                    InventoryReferenceType.ORDER_ITEM,
                    item.getId().toString(),
                    createdBy);
            BigDecimal totalCost = BigDecimal.ZERO;
            for (ReservationAllocation allocation : allocations) {
                var lot = inventoryLotRepository.findById(allocation.lotId())
                        .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Inventory lot not found"));
                reservation.addItem(InventoryReservationItemEntity.builder()
                        .orderItem(item)
                        .variant(item.getVariant())
                        .lot(lot)
                        .reservedQuantity(allocation.quantity())
                        .exportedQuantity(0)
                        .unitCost(allocation.unitCost())
                        .build());
                totalCost = totalCost.add(allocation.unitCost().multiply(BigDecimal.valueOf(allocation.quantity())));
            }
            if (item.getQuantity() > 0) {
                item.setUnitCost(totalCost.divide(BigDecimal.valueOf(item.getQuantity()), 2, java.math.RoundingMode.HALF_UP));
            }
        }
        reservation.markReserved();
        return inventoryReservationRepository.save(reservation);
    }

    @Transactional
    public void commitOrderReservation(OrderEntity order, UUID committedBy) {
        InventoryReservationEntity reservation = getReservedReservation(order.getId());
        List<InventoryReservationItemEntity> items = inventoryReservationItemRepository.findByOrderId(order.getId());
        if (items.isEmpty()) {
            throw new AppException(ErrorCode.CONFLICT, "Order has no reserved inventory");
        }
        Map<UUID, List<ReservationAllocation>> allocationsByVariant = items.stream()
                .map(item -> Map.entry(item.getVariant().getId(), new ReservationAllocation(
                        item.getLot().getId(),
                        item.getRemainingReservedQuantity(),
                        item.getUnitCost() != null ? item.getUnitCost() : item.getLot().getUnitCost())))
                .filter(entry -> entry.getValue().quantity() > 0)
                .collect(Collectors.groupingBy(Map.Entry::getKey,
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())));
        if (allocationsByVariant.isEmpty()) {
            throw new AppException(ErrorCode.CONFLICT, "Order has no remaining reserved inventory");
        }
        for (Map.Entry<UUID, List<ReservationAllocation>> entry : allocationsByVariant.entrySet()) {
            inventoryCommandService.exportAllocations(
                    entry.getKey(),
                    entry.getValue(),
                    InventoryReferenceType.ORDER,
                    order.getId().toString(),
                    committedBy);
        }
        items.forEach(item -> item.markExported(item.getRemainingReservedQuantity()));
        reservation.markCommitted();
        inventoryReservationItemRepository.saveAll(items);
        inventoryReservationRepository.save(reservation);
    }

    @Transactional
    public void releaseOrderReservation(OrderEntity order, UUID releasedBy) {
        inventoryReservationRepository.findByOrderId(order.getId())
                .filter(InventoryReservationEntity::isReserved)
                .ifPresent(reservation -> releaseReservation(reservation, releasedBy, false));
    }

    @Transactional
    public void clearOrderReservationExpiry(OrderEntity order) {
        inventoryReservationRepository.findByOrderId(order.getId())
                .filter(InventoryReservationEntity::isReserved)
                .ifPresent(reservation -> {
                    reservation.setExpiresAt(null);
                    inventoryReservationRepository.save(reservation);
                });
    }

    @Transactional
    public void expireReservation(UUID reservationId) {
        inventoryReservationRepository.findByIdForUpdate(reservationId)
                .filter(InventoryReservationEntity::isReserved)
                .filter(reservation -> reservation.getExpiresAt() != null && reservation.getExpiresAt().isBefore(Instant.now()))
                .ifPresent(reservation -> releaseReservation(reservation, null, true));
    }

    @Transactional
    public List<UUID> findExpiredReservationIds(Instant now) {
        return inventoryReservationRepository.findExpiredReservedIds(InventoryReservationStatus.RESERVED, now);
    }

    private void releaseReservation(InventoryReservationEntity reservation, UUID releasedBy, boolean expired) {
        List<InventoryReservationItemEntity> items = inventoryReservationItemRepository.findByOrderId(reservation.getOrder().getId());
        Map<UUID, List<ReservationAllocation>> allocationsByVariant = items.stream()
                .map(item -> Map.entry(item.getVariant().getId(), new ReservationAllocation(
                        item.getLot().getId(),
                        item.getRemainingReservedQuantity(),
                        item.getUnitCost() != null ? item.getUnitCost() : item.getLot().getUnitCost())))
                .filter(entry -> entry.getValue().quantity() > 0)
                .collect(Collectors.groupingBy(Map.Entry::getKey,
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())));
        allocationsByVariant.forEach((variantId, allocations) -> inventoryCommandService.releaseAllocations(
                variantId,
                allocations,
                InventoryReferenceType.ORDER,
                reservation.getOrder().getId().toString(),
                releasedBy));
        if (expired) {
            reservation.markExpired();
        } else {
            reservation.markReleased();
        }
        inventoryReservationRepository.save(reservation);
    }

    private InventoryReservationEntity getReservedReservation(UUID orderId) {
        InventoryReservationEntity reservation = inventoryReservationRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.CONFLICT, "Order has no inventory reservation"));
        if (!reservation.isReserved()) {
            throw new AppException(ErrorCode.CONFLICT,
                    "Order inventory reservation is " + reservation.getStatus());
        }
        return reservation;
    }

    private Instant resolveExpiresAt(OrderEntity order) {
        if (order.getFlashSaleReservationId() != null) {
            return Instant.now().plus(Duration.ofSeconds(flashSaleReservationTtlSeconds));
        }
        if (order.getPayment() != null && order.getPayment().getMethod() == PaymentMethod.BANK_TRANSFER) {
            return Instant.now().plus(Duration.ofSeconds(pendingPaymentTimeoutSeconds));
        }
        return Instant.now().plus(Duration.ofSeconds(codConfirmationTimeoutSeconds));
    }
}
