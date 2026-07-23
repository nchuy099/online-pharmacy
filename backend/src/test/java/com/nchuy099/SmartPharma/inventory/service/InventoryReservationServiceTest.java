package com.nchuy099.SmartPharma.inventory.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryReferenceType;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryReservationStatus;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryReservationType;
import com.nchuy099.SmartPharma.inventory.entity.InventoryLotEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventoryReservationEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventoryReservationItemEntity;
import com.nchuy099.SmartPharma.inventory.model.ReservationAllocation;
import com.nchuy099.SmartPharma.inventory.repository.InventoryLotRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventoryReservationItemRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventoryReservationRepository;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderItemEntity;
import com.nchuy099.SmartPharma.payment.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class InventoryReservationServiceTest {

    private InventoryCommandService inventoryCommandService;
    private InventoryLotRepository inventoryLotRepository;
    private InventoryReservationRepository reservationRepository;
    private InventoryReservationItemRepository reservationItemRepository;
    private InventoryReservationService service;

    @BeforeEach
    void setUp() {
        inventoryCommandService = mock(InventoryCommandService.class);
        inventoryLotRepository = mock(InventoryLotRepository.class);
        reservationRepository = mock(InventoryReservationRepository.class);
        reservationItemRepository = mock(InventoryReservationItemRepository.class);
        service = new InventoryReservationService(
                inventoryCommandService,
                inventoryLotRepository,
                reservationRepository,
                reservationItemRepository,
                600,
                86400,
                300);
        when(reservationRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void reserveOrderShouldCreateReservationHeaderAndFefoItems() {
        UUID userId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();
        UUID lotAId = UUID.randomUUID();
        UUID lotBId = UUID.randomUUID();
        OrderEntity order = order(orderId, userId, item(itemId, variantId, 8), PaymentMethod.BANK_TRANSFER);
        InventoryLotEntity lotA = lot(lotAId, new BigDecimal("10000"));
        InventoryLotEntity lotB = lot(lotBId, new BigDecimal("12000"));

        when(reservationRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(inventoryCommandService.reserveStock(variantId, 8, InventoryReferenceType.ORDER_ITEM, itemId.toString(), userId))
                .thenReturn(List.of(
                        new ReservationAllocation(lotAId, 5, new BigDecimal("10000")),
                        new ReservationAllocation(lotBId, 3, new BigDecimal("12000"))));
        when(inventoryLotRepository.findById(lotAId)).thenReturn(Optional.of(lotA));
        when(inventoryLotRepository.findById(lotBId)).thenReturn(Optional.of(lotB));

        InventoryReservationEntity reservation = service.reserveOrder(order, userId);

        assertThat(reservation.getReservationKey()).isEqualTo("ORDER:" + orderId);
        assertThat(reservation.getReservationType()).isEqualTo(InventoryReservationType.ORDER);
        assertThat(reservation.getStatus()).isEqualTo(InventoryReservationStatus.RESERVED);
        assertThat(reservation.getExpiresAt()).isNotNull();
        assertThat(reservation.getItems()).hasSize(2);
        assertThat(order.getItems().get(0).getUnitCost()).isEqualByComparingTo("10750.00");
    }

    @Test
    void commitOrderReservationShouldExportItemsAndMarkCommitted() {
        UUID orderId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();
        UUID lotId = UUID.randomUUID();
        OrderEntity order = order(orderId, UUID.randomUUID(), item(UUID.randomUUID(), variantId, 2), PaymentMethod.COD);
        InventoryReservationEntity reservation = reservation(order);
        InventoryReservationItemEntity item = reservationItem(reservation, order.getItems().get(0), lotId, 2);

        when(reservationRepository.findByOrderId(orderId)).thenReturn(Optional.of(reservation));
        when(reservationItemRepository.findByOrderId(orderId)).thenReturn(List.of(item));

        service.commitOrderReservation(order, null);

        verify(inventoryCommandService).exportAllocations(
                eq(variantId),
                eq(List.of(new ReservationAllocation(lotId, 2, new BigDecimal("10000")))),
                eq(InventoryReferenceType.ORDER),
                eq(orderId.toString()),
                eq(null));
        assertThat(item.getExportedQuantity()).isEqualTo(2);
        assertThat(reservation.getStatus()).isEqualTo(InventoryReservationStatus.COMMITTED);
        assertThat(reservation.getCommittedAt()).isNotNull();
    }

    @Test
    void releaseOrderReservationShouldReleaseOnlyReservedReservationOnce() {
        UUID userId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();
        UUID lotId = UUID.randomUUID();
        OrderEntity order = order(orderId, userId, item(UUID.randomUUID(), variantId, 2), PaymentMethod.COD);
        InventoryReservationEntity reservation = reservation(order);
        InventoryReservationItemEntity item = reservationItem(reservation, order.getItems().get(0), lotId, 2);

        when(reservationRepository.findByOrderId(orderId)).thenReturn(Optional.of(reservation));
        when(reservationItemRepository.findByOrderId(orderId)).thenReturn(List.of(item));

        service.releaseOrderReservation(order, userId);

        verify(inventoryCommandService).releaseAllocations(
                eq(variantId),
                eq(List.of(new ReservationAllocation(lotId, 2, new BigDecimal("10000")))),
                eq(InventoryReferenceType.ORDER),
                eq(orderId.toString()),
                eq(userId));
        assertThat(reservation.getStatus()).isEqualTo(InventoryReservationStatus.RELEASED);
        assertThat(reservation.getReleasedAt()).isNotNull();
    }

    private static OrderEntity order(UUID orderId, UUID userId, OrderItemEntity item, PaymentMethod paymentMethod) {
        UserEntity user = new UserEntity();
        user.setId(userId);
        PaymentEntity payment = PaymentEntity.builder().method(paymentMethod).amount(BigDecimal.ZERO).build();
        OrderEntity order = OrderEntity.builder()
                .user(user)
                .payment(payment)
                .items(new java.util.ArrayList<>(List.of(item)))
                .finalAmount(BigDecimal.ZERO)
                .build();
        order.setId(orderId);
        item.setOrder(order);
        return order;
    }

    private static OrderItemEntity item(UUID itemId, UUID variantId, int quantity) {
        ProductVariantEntity variant = ProductVariantEntity.builder()
                .sku("SKU-" + variantId)
                .unitType("box")
                .salePrice(BigDecimal.ZERO)
                .build();
        variant.setId(variantId);
        OrderItemEntity item = OrderItemEntity.builder()
                .variant(variant)
                .quantity(quantity)
                .unitPrice(BigDecimal.ZERO)
                .totalPrice(BigDecimal.ZERO)
                .build();
        item.setId(itemId);
        return item;
    }

    private static InventoryLotEntity lot(UUID lotId, BigDecimal unitCost) {
        InventoryLotEntity lot = InventoryLotEntity.builder().unitCost(unitCost).build();
        lot.setId(lotId);
        return lot;
    }

    private static InventoryReservationEntity reservation(OrderEntity order) {
        InventoryReservationEntity reservation = InventoryReservationEntity.builder()
                .reservationKey("ORDER:" + order.getId())
                .order(order)
                .reservationType(InventoryReservationType.ORDER)
                .status(InventoryReservationStatus.RESERVED)
                .build();
        reservation.setId(UUID.randomUUID());
        return reservation;
    }

    private static InventoryReservationItemEntity reservationItem(
            InventoryReservationEntity reservation,
            OrderItemEntity orderItem,
            UUID lotId,
            int quantity) {
        ProductVariantEntity variant = orderItem.getVariant();
        InventoryLotEntity lot = lot(lotId, new BigDecimal("10000"));
        InventoryReservationItemEntity item = InventoryReservationItemEntity.builder()
                .reservation(reservation)
                .orderItem(orderItem)
                .variant(variant)
                .lot(lot)
                .reservedQuantity(quantity)
                .exportedQuantity(0)
                .unitCost(new BigDecimal("10000"))
                .build();
        item.setId(UUID.randomUUID());
        return item;
    }
}
