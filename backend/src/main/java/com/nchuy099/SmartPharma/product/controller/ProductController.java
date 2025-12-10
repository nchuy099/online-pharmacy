package com.nchuy099.SmartPharma.product.controller;

import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.product.dto.response.ProductPageResponse;
import com.nchuy099.SmartPharma.product.dto.response.ProductResponse;
import com.nchuy099.SmartPharma.product.service.ProductService;
import java.util.Map;
import java.util.LinkedHashMap;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/products")
@Slf4j
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

      @GetMapping("/debug/headers")
    public Map<String, Object> debugHeaders(HttpServletRequest request) {
        Map<String, Object> result = new LinkedHashMap<>();

        result.put("scheme", request.getScheme());
        result.put("serverName", request.getServerName());
        result.put("serverPort", request.getServerPort());
        result.put("requestURL", request.getRequestURL().toString());
        result.put("requestURI", request.getRequestURI());
        result.put("queryString", request.getQueryString());

        result.put("Host", request.getHeader("Host"));
        result.put("X-Forwarded-Host", request.getHeader("X-Forwarded-Host"));
        result.put("X-Forwarded-Proto", request.getHeader("X-Forwarded-Proto"));
        result.put("X-Forwarded-Port", request.getHeader("X-Forwarded-Port"));
        result.put("X-Forwarded-For", request.getHeader("X-Forwarded-For"));
        result.put("Forwarded", request.getHeader("Forwarded"));
        result.put("X-Forwarded-Prefix", request.getHeader("X-Forwarded-Prefix"));

        log.info("DEBUG HEADERS => {}", result);

        return result;
    }

    @GetMapping("/{id}/details")
    public ProductResponse getProductDetails(@PathVariable(name = "id") String id) {
        log.info("Get product details request received with id: {}", id);
        return productService.getDetails(UUID.fromString(id));
    }

    @GetMapping("/slug/**")
    public ProductResponse getProductDetailsBySlug(HttpServletRequest request) {
        String fullPath = request.getRequestURI();
        // Extract the part after /products/slug/
        String prefix = request.getContextPath() + "/products/slug/";
        String slug = fullPath.startsWith(prefix) ? fullPath.substring(prefix.length()) : fullPath;
        log.info("Get product details request received with slug: {}", slug);
        return productService.getDetailsBySlug(slug);
    }

    @GetMapping("/{sku}")
    public ProductResponse getProductDetailsBySku(@PathVariable(name = "sku") String sku) {
        log.info("Get product details request received with sku: {}", sku);
        return productService.getDetailsBySku(sku);
    }

    @GetMapping("/list")
    public ProductPageResponse listProducts(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "categorySlug", required = false) String categorySlug,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "minPrice", required = false) java.math.BigDecimal minPrice,
            @RequestParam(name = "maxPrice", required = false) java.math.BigDecimal maxPrice) {
        log.info(
                "List products request received with page: {}, size: {}, categorySlug: {}, search: {}, sortBy: {}, minPrice: {}, maxPrice: {}",
                page, size, categorySlug, search, sortBy, minPrice, maxPrice);
        return productService.getList(page, size, categorySlug, search, sortBy, minPrice, maxPrice, true);

    }
}
