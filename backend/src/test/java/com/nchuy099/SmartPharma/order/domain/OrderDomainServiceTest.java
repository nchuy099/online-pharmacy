package com.nchuy099.SmartPharma.order.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.inventory.domain.enums.TransactionType;
import com.nchuy099.SmartPharma.inventory.repository.InventoryTransactionRepository;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;

class OrderDomainServiceTest {

    @Test
    void buildBuyNowOrderShouldStartBankTransferOrdersAsPendingPayment() {
        InventoryTransactionRepository inventoryTransactionRepository = mock(InventoryTransactionRepository.class);
        OrderDomainService orderDomainService = new OrderDomainService(inventoryTransactionRepository);

        ProductEntity product = ProductEntity.builder()
                .name("Paracetamol")
                .slug("paracetamol")
                .webName("Paracetamol")
                .build();

        ProductVariantEntity variant = ProductVariantEntity.builder()
                .product(product)
                .sku("PARA-500")
                .unitType("box")
                .salePrice(new BigDecimal("120000"))
                .build();

        when(inventoryTransactionRepository.findTopByInventoryVariantIdAndTypeOrderByCreatedAtDesc(
                variant.getId(), TransactionType.IMPORT)).thenReturn(Optional.empty());

        OrderEntity order = orderDomainService.buildBuyNowOrder(null, null, variant, 1, PaymentMethod.BANK_TRANSFER);

        assertEquals(OrderStatus.PENDING_PAYMENT, order.getStatus());
    }
}
