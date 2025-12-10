package com.nchuy099.SmartPharma.product.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.dto.Pagination;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.product.dto.request.CreateCategoryRequest;
import com.nchuy099.SmartPharma.product.dto.request.UpdateCategoryRequest;
import com.nchuy099.SmartPharma.product.dto.request.CreateCategoryWithSlugRequest;
import com.nchuy099.SmartPharma.product.dto.response.CategoryPageResponse;
import com.nchuy099.SmartPharma.product.dto.response.CategoryResponse;
import com.nchuy099.SmartPharma.product.entity.CategoryEntity;
import com.nchuy099.SmartPharma.product.repository.CategoryRepository;
import com.nchuy099.SmartPharma.product.repository.ProductRepository;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

import com.nchuy099.SmartPharma.common.utils.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class CategoryService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public CategoryResponse create(CreateCategoryRequest req) {
        log.info("Processing create category request");

        CategoryEntity categoryEntity = CategoryEntity.builder()
                .name(req.getName())
                .code(generateCategoryCode())
                .level(req.getLevel())
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .build();

        if (req.getParentId() != null && !req.getParentId().isEmpty()) {
            CategoryEntity parent = categoryRepository.findById(UUID.fromString(req.getParentId()))
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Parent category not found"));
            categoryEntity.setParent(parent);
        }

        categoryEntity.setSlug(generateSlug(null, req.getName(), categoryEntity.getParent()));
        categoryRepository.save(categoryEntity);

        return mapToCategoryResponse(categoryEntity);
    }

    public CategoryResponse createWithSlug(CreateCategoryWithSlugRequest req) {
        log.info("Processing create category with slug request");

        String providedSlug = req.getSlug() == null ? "" : req.getSlug().trim();
        if (providedSlug.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Category slug is required");
        }
        if (categoryRepository.findBySlug(providedSlug).isPresent()) {
            throw new AppException(ErrorCode.CONFLICT, "Category slug already exists: " + providedSlug);
        }

        CategoryEntity categoryEntity = CategoryEntity.builder()
                .name(req.getName())
                .code(generateCategoryCode())
                .level(req.getLevel())
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .slug(providedSlug)
                .build();

        if (req.getParentId() != null && !req.getParentId().isEmpty()) {
            CategoryEntity parent = categoryRepository.findById(UUID.fromString(req.getParentId()))
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Parent category not found"));
            categoryEntity.setParent(parent);
        }

        categoryRepository.save(categoryEntity);
        return mapToCategoryResponse(categoryEntity);
    }

    public CategoryResponse updateSlug(UUID id, String slug) {
        log.info("Processing update category slug request with id: {}", id);

        CategoryEntity categoryEntity = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Category not found with id: " + id));

        String providedSlug = slug == null ? "" : slug.trim();
        if (providedSlug.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Category slug is required");
        }

        categoryRepository.findBySlug(providedSlug).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new AppException(ErrorCode.CONFLICT, "Category slug already exists: " + providedSlug);
            }
        });

        categoryEntity.setSlug(providedSlug);
        categoryRepository.save(categoryEntity);
        return mapToCategoryResponse(categoryEntity);
    }

    public CategoryResponse update(UUID id, UpdateCategoryRequest req) {
        log.info("Processing update category request with id: {}", id);

        CategoryEntity categoryEntity = categoryRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Category not found with id: " + id);
                    return new AppException(ErrorCode.NOT_FOUND, "Category not found with id: " + id);
                });

        if (req.getName() != null) {
            categoryEntity.setName(req.getName());
        }
        if (req.getLevel() != null)
            categoryEntity.setLevel(req.getLevel());
        if (req.getIsActive() != null)
            categoryEntity.setIsActive(req.getIsActive());

        if (req.getParentId() != null) {
            if (req.getParentId().isEmpty()) {
                categoryEntity.setParent(null);
            } else {
                CategoryEntity parent = categoryRepository.findById(UUID.fromString(req.getParentId()))
                        .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Parent category not found"));
                categoryEntity.setParent(parent);
            }
        }

        // Always re-evaluate slug on update if name or parent or slug changes
        // Since we don't know if parent/name changed significantly, we update it if req
        // has any of these
        if (req.getName() != null || req.getParentId() != null) {
            categoryEntity.setSlug(generateSlug(null, categoryEntity.getName(), categoryEntity.getParent()));
        }

        categoryRepository.save(categoryEntity);
        return mapToCategoryResponse(categoryEntity);
    }

    private String generateSlug(String requestedSlug, String name, CategoryEntity parent) {
        return (requestedSlug != null && !requestedSlug.trim().isEmpty())
                ? requestedSlug.trim()
                : StringUtils.toSlug(name);
    }

    private String generateCategoryCode() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        for (int attempt = 0; attempt < 2000; attempt++) {
            int number = random.nextInt(1_000_000);
            String code = String.format("CAT%06d", number);
            if (!categoryRepository.existsByCode(code)) {
                return code;
            }
        }
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Unable to generate unique category code");
    }

    public void delete(UUID id) {
        log.info("Processing delete category request with id: {}", id);

        if (!categoryRepository.existsById(id)) {
            log.warn("Category not found with id: " + id);
            throw new AppException(ErrorCode.NOT_FOUND, "Category not found with id: " + id);
        }

        if (productRepository.existsProductUsingCategory(id)) {
            throw new AppException(ErrorCode.CONFLICT, "Category is assigned to products");
        }

        categoryRepository.deleteById(id);
        log.info("Category deleted successfully with id: {}", id);
    }

    public CategoryResponse getDetails(UUID id) {
        log.info("Processing get category details request with id: {}", id);

        CategoryEntity categoryEntity = categoryRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Category not found with id: " + id);
                    return new AppException(ErrorCode.NOT_FOUND, "Category not found with id: " + id);
                });

        return mapToCategoryResponse(categoryEntity);
    }

    public CategoryPageResponse getList(int page, int size, String search, Integer level, Boolean isActive) {
        log.info("Processing get all categories request with search: {}, level: {}, isActive: {}", search, level, isActive);
        if (page > 0)
            page--;
        Pageable pageable = PageRequest.of(page, size);

        String searchPattern = (search != null && !search.trim().isEmpty())
                ? "%" + search.trim().toLowerCase() + "%"
                : null;

        Page<CategoryEntity> categories = categoryRepository.searchCategories(searchPattern, level, isActive, pageable);
        return toCategoryPageResponse(categories);
    }

    private CategoryPageResponse toCategoryPageResponse(Page<CategoryEntity> categoryPage) {
        List<CategoryEntity> pageContent = categoryPage.getContent();
        List<UUID> ids = pageContent.stream().map(CategoryEntity::getId).toList();
        Map<UUID, Long> productCounts = categoryRepository.findProductCountsByIds(ids).stream()
                .collect(Collectors.toMap(
                        CategoryRepository.CategoryProductCount::getCategoryId,
                        CategoryRepository.CategoryProductCount::getProductCount,
                        (v1, v2) -> v1
                ));

        return CategoryPageResponse.builder()
                .categories(pageContent.stream()
                        .map(entity -> {
                            CategoryResponse resp = mapToCategoryResponseBase(entity);
                            resp.setProductCount(productCounts.getOrDefault(entity.getId(), 0L));
                            return resp;
                        })
                        .toList())
                .pagination(Pagination.builder()
                        .page(categoryPage.getNumber() + 1)
                        .size(categoryPage.getSize())
                        .totalPages(categoryPage.getTotalPages())
                        .totalElements(categoryPage.getTotalElements())
                        .build())
                .build();
    }



    public java.util.List<CategoryResponse> getAll() {
        log.info("Processing get all categories request for selection");
        return categoryRepository.findAll().stream()
                .map(this::mapToCategoryResponseBase)
                .toList();
    }

    public java.util.List<CategoryResponse> getAllActive() {
        log.info("Processing get all active categories request (hierarchical - optimized)");
        java.util.List<CategoryEntity> all = categoryRepository.findAllByIsActive(true);
        return buildCategoryTree(all);
    }

    private List<CategoryResponse> buildCategoryTree(List<CategoryEntity> allEntities) {
        if (allEntities.isEmpty()) return new ArrayList<>();

        // 1. Fetch direct product counts for ONLY these categories (1 query)
        List<UUID> ids = allEntities.stream().map(CategoryEntity::getId).toList();
        Map<UUID, Long> productCounts = categoryRepository.findProductCountsByIds(ids).stream()
                .collect(Collectors.toMap(
                        CategoryRepository.CategoryProductCount::getCategoryId,
                        CategoryRepository.CategoryProductCount::getProductCount,
                        (v1, v2) -> v1
                ));


        // 2. Map all entities to DTOs first (flat map)
        Map<String, CategoryResponse> dtoMap = new HashMap<>();
        for (CategoryEntity entity : allEntities) {
            CategoryResponse resp = mapToCategoryResponseBase(entity);
            resp.setProductCount(productCounts.getOrDefault(entity.getId(), 0L));
            dtoMap.put(resp.getId(), resp);
        }

        // 3. Link children and calculate hierarchical counts
        List<CategoryResponse> roots = new ArrayList<>();
        
        // We need to process from bottom up to calculate hierarchical counts correctly
        // Or we can just build the tree and then do a post-order traversal
        for (CategoryEntity entity : allEntities) {
            CategoryResponse current = dtoMap.get(entity.getId().toString());
            if (entity.getParent() == null || !dtoMap.containsKey(entity.getParent().getId().toString())) {
                roots.add(current);
            } else {
                CategoryResponse parent = dtoMap.get(entity.getParent().getId().toString());
                if (parent.getChildren() == null) parent.setChildren(new ArrayList<>());
                parent.getChildren().add(current);
            }
        }

        // 4. Recursive hierarchical count sum
        roots.forEach(this::calculateTotalProductCount);

        // 5. Sort roots
        return roots.stream()
                .sorted(java.util.Comparator.comparingInt(CategoryResponse::getLevel))
                .collect(Collectors.toList());
    }

    private long calculateTotalProductCount(CategoryResponse node) {
        long total = node.getProductCount();
        if (node.getChildren() != null) {
            for (CategoryResponse child : node.getChildren()) {
                total += calculateTotalProductCount(child);
            }
        }
        node.setProductCount(total);
        return total;
    }

    private CategoryResponse mapToCategoryResponseBase(CategoryEntity categoryEntity) {
        return CategoryResponse.builder()
                .id(categoryEntity.getId().toString())
                .code(categoryEntity.getCode())
                .slug(categoryEntity.getSlug())
                .name(categoryEntity.getName())
                .parentId(categoryEntity.getParent() != null ? categoryEntity.getParent().getId().toString() : null)
                .level(categoryEntity.getLevel())
                .isActive(categoryEntity.getIsActive())
                .build();
    }

    private CategoryResponse mapToCategoryResponse(CategoryEntity categoryEntity) {
        // This method is still used for single entity view (getDetails)
        // We can optimize it or keep it as is since it's only for 1 entity.
        // But let's make it hit fewer queries for specific entity as well.
        
        CategoryResponse response = mapToCategoryResponseBase(categoryEntity);

        // For details, we still might want children (Lazy hit)
        // To be safe and minimal change, we keep the recursion but it's only for this branch.
        // If the user wants a full fix for details too:
        if (categoryEntity.getChildren() != null && !categoryEntity.getChildren().isEmpty()) {
            java.util.List<CategoryResponse> children = categoryEntity.getChildren().stream()
                    .filter(CategoryEntity::getIsActive)
                    .map(this::mapToCategoryResponse)
                    .sorted(java.util.Comparator.comparingInt(CategoryResponse::getLevel))
                    .toList();
            response.setChildren(children);

            long childrenCount = children.stream().mapToLong(CategoryResponse::getProductCount).sum();
            response.setProductCount(categoryEntity.getProducts().size() + childrenCount);
        } else {
            response.setProductCount(categoryEntity.getProducts().size());
        }

        return response;
    }
}
