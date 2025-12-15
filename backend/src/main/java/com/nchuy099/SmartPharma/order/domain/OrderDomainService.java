package com.nchuy099.SmartPharma.order.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.inventory.domain.enums.TransactionType;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.order.domain.enums.PaymentStatus;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderItemEntity;
import com.nchuy099.SmartPharma.order.domain.entity.PaymentEntity;

import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.inventory.repository.InventoryTransactionRepository;
import com.nchuy099.SmartPharma.user.entity.UserEntity;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderDomainService {

        private final InventoryTransactionRepository inventoryTransactionRepository;

        private BigDecimal resolveUnitCost(ProductVariantEntity variant) {
                if (variant == null) {
                        return BigDecimal.ZERO;
                }
                if (variant.getAverageCost() != null) {
                        return variant.getAverageCost();
                }
                if (variant.getLatestImportCost() != null) {
                        return variant.getLatestImportCost();
                }
                return resolveUnitCost(variant.getId(), null);
        }

        private BigDecimal resolveUnitCost(ProductVariantEntity variant, Map<UUID, BigDecimal> costCache) {
                if (variant == null) {
                        return BigDecimal.ZERO;
                }
                if (variant.getAverageCost() != null) {
                        return variant.getAverageCost();
                }
                if (variant.getLatestImportCost() != null) {
                        return variant.getLatestImportCost();
                }
                return resolveUnitCost(variant.getId(), costCache);
        }

        private BigDecimal resolveUnitCost(UUID variantId, Map<UUID, BigDecimal> costCache) {
                if (variantId == null) {
                        return BigDecimal.ZERO;
                }
                if (costCache != null && costCache.containsKey(variantId)) {
                        return costCache.get(variantId);
                }

                BigDecimal cost = inventoryTransactionRepository
                        .findTopByInventoryVariantIdAndTypeOrderByCreatedAtDesc(variantId, TransactionType.IMPORT)
                        .map(t -> t.getUnitCost() != null ? t.getUnitCost() : BigDecimal.ZERO)
                        .orElse(BigDecimal.ZERO);

                if (costCache != null) {
                        costCache.put(variantId, cost);
                }
                return cost;
        }

        public BigDecimal calculateAmount(ProductVariantEntity variant, int qty) {
                return variant.getSalePrice().multiply(BigDecimal.valueOf(qty));
        }

        public BigDecimal calculateCartAmount(List<CartItemEntity> items) {
                return items.stream().map(CartItemEntity::calculateLineTotal)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        public OrderEntity buildBuyNowOrder(UserEntity user, String note,
                        ProductVariantEntity variant, int qty,
                        PaymentMethod method) {

                BigDecimal amount = variant.getSalePrice().multiply(BigDecimal.valueOf(qty));

                OrderItemEntity item = OrderItemEntity.builder()
                                .unitPrice(variant.getSalePrice())
                                .unitCost(resolveUnitCost(variant))
                                .product(variant.getProduct())
                                .variant(variant)
                                .quantity(qty)
                                .totalPrice(amount)
                                .snapshotProductName(variant.getProduct().getName())
                                .snapshotSku(variant.getSku())
                                .snapshotUnit(variant.getUnit())
                                .snapshotPrimaryImage(variant.getProduct().getPrimaryImage())
                                .build();

                PaymentEntity payment = buildPayment(amount, method);

                OrderEntity order = OrderEntity.builder()
                                .user(user)
                                .note(note)
                                .orderCode(generateOrderCode())
                                .status(determineInitialStatus(method))
                                .itemTotalAmount(amount)
                                .finalAmount(amount)
                                .build();

                order.addItem(item);
                order.setPayment(payment);

                return order;
        }

        public OrderEntity buildCartOrder(UserEntity user, String note,
                        List<CartItemEntity> cartItems,
                        PaymentMethod method) {

                BigDecimal amount = calculateCartAmount(cartItems);
                Map<UUID, BigDecimal> unitCostCache = new HashMap<>();

                PaymentEntity payment = buildPayment(amount, method);

                OrderEntity order = OrderEntity.builder()
                                .user(user)
                                .note(note)
                                .orderCode(generateOrderCode())
                                .status(determineInitialStatus(method))
                                .itemTotalAmount(amount)
                                .finalAmount(amount)
                                .build();

                cartItems.forEach(ci -> order.addItem(OrderItemEntity.builder()
                                .product(ci.getVariant().getProduct())
                                .variant(ci.getVariant())
                                .unitPrice(ci.getVariant().getSalePrice())
                                .unitCost(resolveUnitCost(ci.getVariant(), unitCostCache))
                                .quantity(ci.getQuantity())
                                .totalPrice(ci.calculateLineTotal())
                                .snapshotProductName(ci.getVariant().getProduct().getName())
                                .snapshotSku(ci.getVariant().getSku())
                                .snapshotUnit(ci.getVariant().getUnit())
                                .snapshotPrimaryImage(ci.getVariant().getProduct().getPrimaryImage())
                                .build()));

                order.setPayment(payment);

                return order;
        }

        private OrderStatus determineInitialStatus(PaymentMethod method) {
                return method == PaymentMethod.BANK_TRANSFER
                                ? OrderStatus.PENDING_PAYMENT
                                : OrderStatus.PENDING;
        }

        private PaymentEntity buildPayment(BigDecimal amount, PaymentMethod method) {
                return PaymentEntity.builder()
                                .amount(amount)
                                .method(method)
                                .status(PaymentStatus.INITIATED)
                                .build();
        }

        private String generateOrderCode() {
                String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
                String randomPart = generateRandomString(8);
                return "ORD" + datePart + randomPart;
        }

        private String generateRandomString(int length) {
                String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                StringBuilder sb = new StringBuilder();
                Random random = new Random();
                for (int i = 0; i < length; i++) {
                        sb.append(chars.charAt(random.nextInt(chars.length())));
                }
                return sb.toString();
        }

}
