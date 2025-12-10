package com.nchuy099.SmartPharma.product.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.user.enums.RbacPermissions;
import com.nchuy099.SmartPharma.product.dto.request.CreateProductVariantRequest;
import com.nchuy099.SmartPharma.product.dto.request.UpdateProductVariantRequest;
import com.nchuy099.SmartPharma.product.dto.response.ProductResponse;
import com.nchuy099.SmartPharma.product.service.ProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/admin/products/{productId}/variants")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('STAFF', 'SUPER_ADMIN')")
public class AdminProductVariantController {

    private final ProductService productService;

    @GetMapping
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_PRODUCT)")
    public List<ProductResponse.VariantResponse> getVariants(@PathVariable String productId) {
        log.info("Get product variants request received for productId: {}", productId);
        return productService.getVariants(UUID.fromString(productId));
    }

    @PostMapping("/create")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).CREATE_PRODUCT)")
    public ProductResponse.VariantResponse createVariant(
            @PathVariable String productId,
            @RequestBody @Valid CreateProductVariantRequest req) {
        log.info("Create product variant request received for productId: {}", productId);
        return productService.createVariant(UUID.fromString(productId), req);
    }

    @PutMapping("/{variantId}/update")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).UPDATE_PRODUCT)")
    public ProductResponse.VariantResponse updateVariant(
            @PathVariable String productId,
            @PathVariable String variantId,
            @RequestBody @Valid UpdateProductVariantRequest req) {
        log.info("Update product variant request received for productId: {}, variantId: {}", productId, variantId);
        return productService.updateVariant(UUID.fromString(productId), UUID.fromString(variantId), req);
    }

    @DeleteMapping("/{variantId}/delete")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).DELETE_PRODUCT)")
    public void deleteVariant(@PathVariable String productId, @PathVariable String variantId) {
        log.info("Delete product variant request received for productId: {}, variantId: {}", productId, variantId);
        productService.deleteVariant(UUID.fromString(productId), UUID.fromString(variantId));
    }
}
