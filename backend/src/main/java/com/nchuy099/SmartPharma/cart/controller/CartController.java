package com.nchuy099.SmartPharma.cart.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.cart.dto.request.AddCartItemRequest;
import com.nchuy099.SmartPharma.cart.dto.request.UpdateCartItemRequest;
import com.nchuy099.SmartPharma.cart.dto.response.CartPageResponse;
import com.nchuy099.SmartPharma.cart.service.CartService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/cart")
@Slf4j
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    @PostMapping("/items/add")
    public void addItem(@RequestBody @Valid AddCartItemRequest request) {
        log.info("Add item to cart request received ");
        cartService.addItem(request);
    }

    @PutMapping("/items/{id}/update")
    public CartPageResponse updateItem(
            @PathVariable(name = "id") String id,
            @RequestBody UpdateCartItemRequest request) {
        log.info("Update cart item request received");
        return cartService.updateItem(id, request);
    }

    @DeleteMapping("/items/{id}/remove")
    public void removeItem(@PathVariable(name = "id") String id) {
        log.info("Remove cart item request received");
        cartService.removeItem(id);
    }

    @DeleteMapping("/clear")
    public void clearCart() {
        log.info("Clear cart request received");
        cartService.delete();
    }

    @GetMapping("/details")
    public CartPageResponse getCartDetails(
            @RequestParam(name = "cursor", required = false) String cursor,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        log.info("Get cart details request received");
        return cartService.getDetails(cursor, size);
    }
}
