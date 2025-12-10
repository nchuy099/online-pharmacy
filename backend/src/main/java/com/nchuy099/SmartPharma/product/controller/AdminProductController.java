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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.user.enums.RbacPermissions;
import com.nchuy099.SmartPharma.product.dto.request.CreateProductRequest;
import com.nchuy099.SmartPharma.product.dto.request.UpdateProductCategoriesRequest;
import com.nchuy099.SmartPharma.product.dto.request.UpdateProductRequest;
import com.nchuy099.SmartPharma.product.dto.response.ProductImageUploadUrlResp;
import com.nchuy099.SmartPharma.product.dto.response.ProductPageResponse;
import com.nchuy099.SmartPharma.product.dto.response.ProductResponse;
import com.nchuy099.SmartPharma.product.service.ProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/admin/products")
@Slf4j
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'SUPER_ADMIN')")
public class AdminProductController {

    private final ProductService productService;

    @PostMapping("/images/upload-url/create")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).UPLOAD_PRODUCT_IMAGE)")
    public ProductImageUploadUrlResp createProductImageUploadUrl() {
        log.info("Create product image upload url request received");
        return productService.createProductImageUploadUrl();
    }

    @PostMapping("/create")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).CREATE_PRODUCT)")
    public ProductResponse createProduct(@RequestBody @Valid CreateProductRequest req) {
        log.info("Create product request received");
        return productService.create(req);
    }

    @PostMapping("/create-batch")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).CREATE_PRODUCT)")
    public List<ProductResponse> createBatchProducts(@RequestBody @Valid List<@Valid CreateProductRequest> req) {
        log.info("Batch create product request received");
        return productService.createBatch(req);
    }

    @PutMapping("{id}/update")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).UPDATE_PRODUCT)")
    public ProductResponse updateProduct(
            @PathVariable(name = "id") String id,
            @RequestBody @Valid UpdateProductRequest req) {
        log.info("Update product request received with id: {}", id);
        return productService.update(UUID.fromString(id), req);
    }

    @PutMapping("{id}/categories")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).UPDATE_PRODUCT)")
    public ProductResponse updateProductCategories(
            @PathVariable(name = "id") String id,
            @RequestBody @Valid UpdateProductCategoriesRequest req) {
        log.info("Update product categories request received with id: {}", id);
        return productService.updateCategories(UUID.fromString(id), req);
    }

    @DeleteMapping("{id}/delete")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).DELETE_PRODUCT)")
    public void deleteProduct(@PathVariable(name = "id") String id) {
        log.info("Delete product request received with id: {}", id);
        productService.delete(UUID.fromString(id));
    }

    @GetMapping("/{id}/details")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_PRODUCT)")
    public ProductResponse getProductDetails(@PathVariable(name = "id") String id) {
        log.info("Get product details request received with id: {}", id);
        return productService.getDetails(UUID.fromString(id));
    }

    @GetMapping("/list")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_PRODUCT)")
    public ProductPageResponse listProducts(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "categorySlug", required = false) String categorySlug,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "minPrice", required = false) java.math.BigDecimal minPrice,
            @RequestParam(name = "maxPrice", required = false) java.math.BigDecimal maxPrice) {
        log.info(
                "List products request received with page: {}, size: {}, categorySlug: {}, search: {}, minPrice: {}, maxPrice: {}",
                page, size, categorySlug, search, minPrice, maxPrice);
        return productService.getList(page, size, categorySlug, search, null, minPrice, maxPrice, false);

    }
}
