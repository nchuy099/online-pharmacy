package com.nchuy099.SmartPharma.cart.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.cart.dto.request.AddCartItemRequest;
import com.nchuy099.SmartPharma.cart.dto.request.UpdateCartItemRequest;
import com.nchuy099.SmartPharma.cart.entity.CartEntity;
import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.cart.repository.CartItemRepository;
import com.nchuy099.SmartPharma.cart.repository.CartRepository;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.inventory.service.InventoryQueryService;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.product.repository.ProductVariantRepository;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class CartServiceTest {

    private CartItemRepository cartItemRepository;
    private CartRepository cartRepository;
    private SecurityUtils securityUtils;
    private InventoryQueryService inventoryQueryService;
    private ProductVariantRepository productVariantRepository;
    private UserRepository userRepository;
    private CartService cartService;

    @BeforeEach
    void setUp() {
        cartItemRepository = mock(CartItemRepository.class);
        cartRepository = mock(CartRepository.class);
        securityUtils = mock(SecurityUtils.class);
        inventoryQueryService = mock(InventoryQueryService.class);
        productVariantRepository = mock(ProductVariantRepository.class);
        userRepository = mock(UserRepository.class);
        cartService = new CartService(
                cartItemRepository,
                cartRepository,
                securityUtils,
                inventoryQueryService,
                productVariantRepository,
                userRepository);
    }

    @Test
    void getValidCartItemsShouldReturnItemsWhenAllFound() {
        UUID userId = UUID.randomUUID();
        UUID cartItemId = UUID.randomUUID();

        CartItemEntity item = CartItemEntity.builder().build();
        item.setId(cartItemId);

        when(cartItemRepository.findAllWithProductByIdsAndUserId(List.of(cartItemId), userId))
                .thenReturn(List.of(item));

        List<CartItemEntity> result = cartService.getValidCartItems(List.of(cartItemId.toString()), userId);

        assertEquals(1, result.size());
        assertEquals(cartItemId, result.get(0).getId());
    }

    @Test
    void getValidCartItemsShouldThrowWhenSomeIdsMissing() {
        UUID userId = UUID.randomUUID();
        UUID foundId = UUID.randomUUID();
        UUID missingId = UUID.randomUUID();

        CartItemEntity found = CartItemEntity.builder().build();
        found.setId(foundId);

        when(cartItemRepository.findAllWithProductByIdsAndUserId(List.of(foundId, missingId), userId))
                .thenReturn(List.of(found));

        AppException exception = assertThrows(AppException.class,
                () -> cartService.getValidCartItems(List.of(foundId.toString(), missingId.toString()), userId));

        assertEquals("Cart items not found: [" + missingId + "]", exception.getMessage());
    }

    @Test
    void addItemShouldIncrementQuantityWhenVariantAlreadyExistsInCart() {
        UUID userId = UUID.randomUUID();
        UUID cartId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();

        UserEntity user = new UserEntity();
        user.setId(userId);

        CartEntity cart = CartEntity.builder().build();
        cart.setId(cartId);
        cart.setUser(user);

        ProductVariantEntity variant = variant(variantId, "SKU-1");
        CartItemEntity existingItem = CartItemEntity.builder()
                .cart(cart)
                .variant(variant)
                .quantity(2)
                .build();
        existingItem.setId(UUID.randomUUID());
        cart.addItem(existingItem);

        AddCartItemRequest request = new AddCartItemRequest();
        request.setVariantId(variantId.toString());
        request.setQuantity(1);

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(cartRepository.findByUser_Id(userId)).thenReturn(Optional.of(cart));
        when(productVariantRepository.findByIdWithProduct(variantId)).thenReturn(Optional.of(variant));
        when(cartItemRepository.findByVariant_IdAndCart_Id(variantId, cartId)).thenReturn(Optional.of(existingItem));
        doNothing().when(inventoryQueryService).validateAvailableStock(variantId, 3);

        cartService.addItem(request);

        assertEquals(3, existingItem.getQuantity());
        verify(inventoryQueryService).validateAvailableStock(variantId, 3);
    }

    @Test
    void addItemShouldCreateNewItemWithRequestedQuantityWhenVariantNotInCart() {
        UUID userId = UUID.randomUUID();
        UUID cartId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();

        UserEntity user = new UserEntity();
        user.setId(userId);

        CartEntity cart = CartEntity.builder().build();
        cart.setId(cartId);
        cart.setUser(user);

        ProductVariantEntity variant = variant(variantId, "SKU-2");

        AddCartItemRequest request = new AddCartItemRequest();
        request.setVariantId(variantId.toString());
        request.setQuantity(4);

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(cartRepository.findByUser_Id(userId)).thenReturn(Optional.of(cart));
        when(productVariantRepository.findByIdWithProduct(variantId)).thenReturn(Optional.of(variant));
        when(cartItemRepository.findByVariant_IdAndCart_Id(variantId, cartId)).thenReturn(Optional.empty());
        doNothing().when(inventoryQueryService).validateAvailableStock(variantId, 4);

        cartService.addItem(request);

        assertEquals(1, cart.getCartItems().size());
        assertEquals(4, cart.getCartItems().get(0).getQuantity());
        verify(inventoryQueryService).validateAvailableStock(variantId, 4);
    }

    @Test
    void updateItemShouldRejectWhenQuantityExceedsAvailableStock() {
        UUID userId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();

        ProductVariantEntity variant = variant(variantId, "SKU-3");
        CartItemEntity item = CartItemEntity.builder()
                .variant(variant)
                .quantity(1)
                .build();
        item.setId(itemId);

        UpdateCartItemRequest request = new UpdateCartItemRequest();
        request.setQuantity(1000);
        request.setSelected(true);

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(cartItemRepository.findByIdAndCart_User_Id(itemId, userId)).thenReturn(Optional.of(item));
        org.mockito.Mockito.doThrow(new AppException(com.nchuy099.SmartPharma.common.exception.ErrorCode.CONFLICT,
                "Product stock not enough to proceed"))
                .when(inventoryQueryService).validateAvailableStock(variantId, 1000);

        AppException exception = assertThrows(AppException.class, () -> cartService.updateItem(itemId.toString(), request));

        assertEquals("Product stock not enough to proceed", exception.getMessage());
    }

    private ProductVariantEntity variant(UUID variantId, String sku) {
        ProductEntity product = ProductEntity.builder()
                .name("Product")
                .webName("Product")
                .slug("product")
                .build();
        product.setId(UUID.randomUUID());

        ProductVariantEntity variant = ProductVariantEntity.builder()
                .product(product)
                .sku(sku)
                .unitType("Box")
                .salePrice(java.math.BigDecimal.valueOf(1000))
                .build();
        variant.setId(variantId);
        return variant;
    }
}
