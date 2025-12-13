package com.nchuy099.SmartPharma.cart.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.cart.dto.request.AddCartItemRequest;
import com.nchuy099.SmartPharma.cart.dto.request.UpdateCartItemRequest;
import com.nchuy099.SmartPharma.cart.dto.response.CartItemResponse;
import com.nchuy099.SmartPharma.cart.dto.response.CartPageResponse;
import com.nchuy099.SmartPharma.cart.entity.CartEntity;
import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.cart.repository.CartItemRepository;
import com.nchuy099.SmartPharma.cart.repository.CartRepository;
import com.nchuy099.SmartPharma.common.dto.Cursor;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.CursorUtils;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.inventory.service.InventoryDomainService;
import com.nchuy099.SmartPharma.inventory.entity.InventoryEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.product.repository.ProductVariantRepository;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final CartRepository cartRepository;
    private final SecurityUtils securityUtils;
    private final InventoryDomainService inventoryDomainService;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;

    @Transactional
    public void addItem(AddCartItemRequest req) {
        log.info("Processing Add Item to cart request");
        UUID userId = securityUtils.getCurrentUserId();

        // user
        UserEntity user = userRepository.findById(userId).orElseThrow(
                () -> {
                    log.warn("User not found");
                    throw new AppException(ErrorCode.NOT_FOUND, "User not found");
                });

        // variant
        UUID variantId;
        try {
            variantId = UUID.fromString(req.getVariantId());
        } catch (Exception ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid variantId: " + req.getVariantId());
        }

        InventoryEntity inventory = inventoryDomainService.getInventory(variantId.toString());
        ProductVariantEntity variant = inventory.getVariant();

        // cart

        CartEntity cart = cartRepository.findByUser_Id(userId).orElseGet(() -> cartRepository.save(
                CartEntity.builder()
                        .user(user)
                        .build()));

        CartItemEntity item = cartItemRepository
                .findByVariant_IdAndCart_Id(variantId, cart.getId()).orElseGet(
                        () -> {
                            CartItemEntity newItem = CartItemEntity.builder()
                                    .cart(cart)
                                    .variant(variant)
                                    .build();
                            cart.addItem(newItem);
                            return newItem;
                        });

        int nextQuantity = item.getQuantity() + req.getQuantity();
        ensureQuantityWithinAvailableStock(inventory, nextQuantity);
        item.setQuantity(nextQuantity);
    }

    @Transactional
    public CartPageResponse updateItem(String itemId, UpdateCartItemRequest req) {
        log.info("Processing Update item request");

        UUID userId = securityUtils.getCurrentUserId();
        CartItemEntity item = cartItemRepository.findByIdAndCart_User_Id(UUID.fromString(itemId), userId)
                .orElseThrow(
                        () -> {
                            log.warn("Cart item not found or not owned by user");
                            throw new AppException(ErrorCode.NOT_FOUND, "Cart item not found");
                        });

        Integer qty = req.getQuantity();

        if (qty != null) {
            if (qty < 0) {
                log.warn("Quantity must be >= 0");
                throw new AppException(ErrorCode.BAD_REQUEST, "Quantity must be >= 0");
            }

            if (qty == 0) {
                cartItemRepository.delete(item);
                return getDetails(null, 10); // Or appropriate cursor/size
            }

            ensureQuantityWithinAvailableStock(
                    item.getVariant().getInventory() != null
                            ? item.getVariant().getInventory()
                            : inventoryDomainService.getInventory(item.getVariant().getId().toString()),
                    qty);
            item.setQuantity(qty);
        }

        if (req.getSelected() != null) {
            item.setSelected(req.getSelected());
        }

        return getDetails(null, 10);
    }

    @Transactional
    public void removeItem(String itemId) {
        log.info("Processing Remove cart item request");

        UUID userId = securityUtils.getCurrentUserId();
        CartItemEntity item = cartItemRepository.findByIdAndCart_User_Id(UUID.fromString(itemId), userId)
                .orElseThrow(
                        () -> {
                            log.warn("Cart item not found or not owned by user");
                            throw new AppException(ErrorCode.NOT_FOUND, "Cart item not found");
                        });

        item.removeFromCart();
    }

    @Transactional
    public void delete() {
        log.info("Processing clear cart request");

        UUID userId = securityUtils.getCurrentUserId();
        CartEntity cart = cartRepository.findByUser_Id(userId).orElseThrow(
                () -> {
                    log.warn("Cart not found");
                    throw new AppException(ErrorCode.NOT_FOUND, "CArt not found");
                });

        cart.getCartItems().clear();
    }

    @Transactional
    public void deleteForProd() {
        log.info("Processing clear cart request");

        UUID userId = securityUtils.getCurrentUserId();
        cartItemRepository.deleteAllCartItemsByUserId(userId);
    }

    public CartPageResponse getDetails(String cursor, int size) {
        log.info("Processing Get current user's cart request");

        // user
        UUID userId = securityUtils.getCurrentUserId();

        userRepository.findById(userId).orElseThrow(
                () -> {
                    log.warn("User not found");
                    throw new AppException(ErrorCode.NOT_FOUND, "User not found");
                });

        CartEntity cart = cartRepository.findByUser_Id(userId).orElse(null);
        if (cart == null) {
            return CartPageResponse.builder()
                    .items(Collections.emptyList())
                    .cursor(Cursor.builder()
                            .nextCursor(null)
                            .hasMore(false)
                            .build())
                    .totalDistinctItems(0)
                    .selectedSummary(CartPageResponse.CartSummaryResponse.builder()
                            .totalDistinctItems(0)
                            .grandTotal(BigDecimal.ZERO)
                            .build())
                    .build();
        }

        CursorUtils.CursorData cursorData = CursorUtils.decode(cursor);

        Instant createdAt;
        UUID cartItemId;

        if (cursorData == null) {
            createdAt = Instant.now().plus(1, ChronoUnit.DAYS);
            cartItemId = UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff");
        } else {
            createdAt = cursorData.createdAt();
            cartItemId = UUID.fromString(cursorData.id());
        }

        Pageable pageable = PageRequest.of(0, size + 1);
        List<CartItemEntity> pageItems = cartItemRepository.findUserCartList(cartItemId, createdAt, cart.getId(),
                pageable);

        boolean hasMore = pageItems.size() > size;
        if (hasMore) {
            pageItems = pageItems.subList(0, size);
        }

        String nextCursor = null;

        if (!pageItems.isEmpty()) {
            CartItemEntity lastItem = pageItems.get(pageItems.size() - 1);

            nextCursor = CursorUtils.encode(lastItem.getCreatedAt(), lastItem.getId().toString());
        }

        List<UUID> pageItemIds = pageItems.stream().map(CartItemEntity::getId).toList();
        List<CartItemEntity> items = pageItemIds.isEmpty()
                ? Collections.emptyList()
                : cartItemRepository.findAllWithProductByIdsAndUserId(pageItemIds, userId);
        java.util.Map<UUID, CartItemEntity> hydratedById = items.stream()
                .collect(Collectors.toMap(CartItemEntity::getId, java.util.function.Function.identity()));

        long totalDistinctItems = cartItemRepository.countByCartId(cart.getId());
        long selectedDistinctItems = cartItemRepository.countSelectedByCartId(cart.getId());
        BigDecimal selectedGrandTotal = cartItemRepository.sumSelectedGrandTotalByCartId(cart.getId());
        if (selectedGrandTotal == null) {
            selectedGrandTotal = BigDecimal.ZERO;
        }

        return CartPageResponse.builder()
                .items(pageItemIds.stream().map(hydratedById::get).filter(java.util.Objects::nonNull).map(
                        item -> CartItemResponse.builder()
                                .id(item.getId().toString())
                                .selected(item.getSelected())
                                .productInfo(CartItemResponse.ProductInfoResponse.builder()
                                        .productId(item.getVariant().getProduct().getId().toString())
                                        .variantId(item.getVariant().getId().toString())
                                        .name(item.getVariant().getProduct().getName())
                                        .webName(item.getVariant().getProduct().getWebName())
                                        .slug(item.getVariant().getProduct().getSlug())
                                        .sku(item.getVariant().getSku())
                                        .unit(item.getVariant().getUnit())
                                        .unitPrice(item.getVariant().getSalePrice())
                                        .quantity(item.getQuantity())
                                        .imageUrl(item.getVariant().getProduct().getPrimaryImage())
                                        .availableQuantity(item.getVariant().getInventory() != null
                                                ? item.getVariant().getInventory().getQuantityAvailable()
                                                : 0)
                                        .build())
                                .build())
                        .toList())
                .totalDistinctItems(Math.toIntExact(totalDistinctItems))
                .selectedSummary(CartPageResponse.CartSummaryResponse.builder()
                        .totalDistinctItems(Math.toIntExact(selectedDistinctItems))
                        .grandTotal(selectedGrandTotal)
                        .build())
                .cursor(Cursor.builder()
                        .nextCursor(nextCursor)
                        .hasMore(hasMore)
                        .build())
                .build();
    }

    public List<CartItemEntity> getCartItemsByVariants(List<UUID> variantIds, UUID userId) {
        return cartItemRepository.findByVariant_IdInAndCart_User_Id(variantIds, userId);
    }

    private void ensureQuantityWithinAvailableStock(InventoryEntity inventory, int requestedQuantity) {
        int availableQuantity = inventory != null ? inventory.getQuantityAvailable() : 0;
        if (requestedQuantity > availableQuantity) {
            log.warn("Requested quantity {} exceeds available stock {} for variant {}", requestedQuantity, availableQuantity,
                    inventory != null && inventory.getVariant() != null ? inventory.getVariant().getId() : null);
            throw new AppException(ErrorCode.CONFLICT, "Not enough stock to reserve");
        }
    }

    public List<CartItemEntity> getValidCartItems(List<String> cartItemStringIds, UUID userId) {
        if (cartItemStringIds == null || cartItemStringIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<UUID> cartItemIds = cartItemStringIds.stream().map(UUID::fromString).toList();
        List<CartItemEntity> items = cartItemRepository.findAllWithProductByIdsAndUserId(cartItemIds, userId);

        if (items.size() != cartItemIds.size()) {
            // Lấy tập ID tìm được từ DB
            Set<UUID> foundIds = items.stream()
                    .map(CartItemEntity::getId)
                    .collect(Collectors.toSet());

            // Lọc ra các ID bị thiếu
            List<UUID> missingIds = cartItemIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();

            log.warn("Cart items not found: " + missingIds);
            throw new AppException(
                    ErrorCode.NOT_FOUND,
                    "Cart items not found: " + missingIds);

        }

        return items;
    }

    public List<CartItemEntity> getSelectedCartItems(UUID userId) {
        List<CartItemEntity> items = cartItemRepository.findSelectedCartItemsByUserId(userId);
        if (items.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "No selected cart items found");
        }
        return items;
    }

    public void removeItems(List<CartItemEntity> items) {
        items.forEach(CartItemEntity::removeFromCart);
    }
}
