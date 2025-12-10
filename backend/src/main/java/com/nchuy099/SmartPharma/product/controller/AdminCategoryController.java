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
import com.nchuy099.SmartPharma.product.dto.request.CreateCategoryRequest;
import com.nchuy099.SmartPharma.product.dto.request.UpdateCategoryRequest;
import com.nchuy099.SmartPharma.product.dto.request.CreateCategoryWithSlugRequest;
import com.nchuy099.SmartPharma.product.dto.request.UpdateCategorySlugRequest;
import com.nchuy099.SmartPharma.product.dto.response.CategoryPageResponse;
import com.nchuy099.SmartPharma.product.dto.response.CategoryResponse;
import com.nchuy099.SmartPharma.product.service.CategoryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/admin/categories")
@Slf4j
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'SUPER_ADMIN')")
public class AdminCategoryController {

    private final CategoryService categoryService;

    @PostMapping("/create")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).CREATE_CATEGORY)")
    public CategoryResponse createCategory(@RequestBody CreateCategoryRequest req) {
        log.info("Create category request received");
        return categoryService.create(req);
    }


    @PostMapping("/create-with-slug")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).CREATE_CATEGORY)")
    public CategoryResponse createCategoryWithSlug(@RequestBody CreateCategoryWithSlugRequest req) {
        log.info("Create category with slug request received");
        return categoryService.createWithSlug(req);
    }

    @PutMapping("{id}/update")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).UPDATE_CATEGORY)")
    public CategoryResponse updateCategory(
            @PathVariable(name = "id") String id,
            @RequestBody UpdateCategoryRequest req) {
        log.info("Update category request received with id: {}", id);
        return categoryService.update(UUID.fromString(id), req);
    }


    @PutMapping("{id}/update-slug")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).UPDATE_CATEGORY)")
    public CategoryResponse updateCategorySlug(
            @PathVariable(name = "id") String id,
            @RequestBody UpdateCategorySlugRequest req) {
        log.info("Update category slug request received with id: {}", id);
        return categoryService.updateSlug(UUID.fromString(id), req.getSlug());
    }

    @DeleteMapping("{id}/delete")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).DELETE_CATEGORY)")
    public void deleteCategory(
            @PathVariable(name = "id") String id) {
        log.info("Delete category request received with id: {}", id);
        categoryService.delete(UUID.fromString(id));
    }

    @GetMapping("/{id}/details")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_CATEGORY)")
    public CategoryResponse getCategoryDetails(
            @PathVariable(name = "id") String id) {
        log.info("Get category details request received with id: {}", id);
        return categoryService.getDetails(UUID.fromString(id));
    }

    @GetMapping("/list")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_CATEGORY)")
    public CategoryPageResponse listCategories(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "level", required = false) Integer level,
            @RequestParam(name = "isActive", required = false) Boolean isActive) {
        log.info("List categories request received with page: {}, size: {}, search: {}, level: {}, active: {}", page,
                size, search, level, isActive);
        return categoryService.getList(page, size, search, level, isActive);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_CATEGORY)")
    public List<CategoryResponse> getAllCategories() {
        log.info("Request to get all categories for selection received");
        return categoryService.getAll();
    }
}
