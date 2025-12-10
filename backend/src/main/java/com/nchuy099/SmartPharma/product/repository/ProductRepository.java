package com.nchuy099.SmartPharma.product.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductImageEntity;
import com.nchuy099.SmartPharma.product.entity.ProductIngredientEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;

@Repository
public interface ProductRepository extends JpaRepository<ProductEntity, UUID> {

    boolean existsByCode(String code);

    @Query("""
            SELECT COUNT(p) > 0
            FROM ProductEntity p
            JOIN p.categories c
            WHERE c.id = :categoryId
            """)
    boolean existsProductUsingCategory(@Param("categoryId") UUID categoryId);

    Page<ProductEntity> findDistinctByCategories_Slug(String slug, Pageable pageable);

    @Query(value = """
            SELECT p.id
            FROM ProductEntity p
            WHERE (:hasCategoryFilter = false OR EXISTS (
                SELECT 1
                FROM p.categories c
                WHERE c.id IN :categoryIds
            ))
            AND (
                :search IS NULL OR :search = '' OR (
                    LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(p.webName) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(p.slug) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR EXISTS (SELECT 1 FROM p.variants v3 WHERE LOWER(v3.sku) LIKE LOWER(CONCAT('%', :search, '%')))
                    OR EXISTS (SELECT 1 FROM p.categories c2 WHERE LOWER(c2.name) LIKE LOWER(CONCAT('%', :search, '%')))
                )
            )
            AND (
                (:minPrice IS NULL AND :maxPrice IS NULL)
                OR EXISTS (
                    SELECT 1
                    FROM p.variants vPrice
                    WHERE vPrice.isActive = true
                      AND (:minPrice IS NULL OR vPrice.salePrice >= :minPrice)
                      AND (:maxPrice IS NULL OR vPrice.salePrice <= :maxPrice)
                )
            )
            ORDER BY p.updatedAt DESC, p.id DESC
            """, countQuery = """
            SELECT COUNT(DISTINCT p)
            FROM ProductEntity p
            WHERE (:hasCategoryFilter = false OR EXISTS (
                SELECT 1
                FROM p.categories c
                WHERE c.id IN :categoryIds
            ))
            AND (
                :search IS NULL OR :search = '' OR (
                    LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(p.webName) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(p.slug) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR EXISTS (SELECT 1 FROM p.variants v3 WHERE LOWER(v3.sku) LIKE LOWER(CONCAT('%', :search, '%')))
                    OR EXISTS (SELECT 1 FROM p.categories c2 WHERE LOWER(c2.name) LIKE LOWER(CONCAT('%', :search, '%')))
                )
            )
            AND (
                (:minPrice IS NULL AND :maxPrice IS NULL)
                OR EXISTS (
                    SELECT 1
                    FROM p.variants vPrice
                    WHERE vPrice.isActive = true
                      AND (:minPrice IS NULL OR vPrice.salePrice >= :minPrice)
                      AND (:maxPrice IS NULL OR vPrice.salePrice <= :maxPrice)
                )
            )
            """)
    Page<UUID> findListProductIdsDefault(
            @Param("categoryIds") Collection<UUID> categoryIds,
            @Param("hasCategoryFilter") boolean hasCategoryFilter,
            @Param("search") String search,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            Pageable pageable);

    @Query(value = """
            SELECT p.id
            FROM ProductEntity p
            JOIN p.variants v
            WHERE v.isActive = true
              AND (:hasCategoryFilter = false OR EXISTS (
                  SELECT 1
                  FROM p.categories c
                  WHERE c.id IN :categoryIds
              ))
              AND (
                  :search IS NULL OR :search = '' OR (
                      LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                      OR LOWER(p.webName) LIKE LOWER(CONCAT('%', :search, '%'))
                      OR LOWER(p.slug) LIKE LOWER(CONCAT('%', :search, '%'))
                      OR EXISTS (SELECT 1 FROM p.variants v3 WHERE LOWER(v3.sku) LIKE LOWER(CONCAT('%', :search, '%')))
                      OR EXISTS (SELECT 1 FROM p.categories c2 WHERE LOWER(c2.name) LIKE LOWER(CONCAT('%', :search, '%')))
                  )
              )
              AND (
                  (:minPrice IS NULL AND :maxPrice IS NULL)
                  OR EXISTS (
                      SELECT 1
                      FROM p.variants vPrice
                      WHERE vPrice.isActive = true
                        AND (:minPrice IS NULL OR vPrice.salePrice >= :minPrice)
                        AND (:maxPrice IS NULL OR vPrice.salePrice <= :maxPrice)
                  )
              )
            GROUP BY p.id, p.updatedAt
            ORDER BY MIN(v.salePrice) ASC, p.updatedAt DESC, p.id DESC
            """, countQuery = """
            SELECT COUNT(DISTINCT p)
            FROM ProductEntity p
            WHERE EXISTS (SELECT 1 FROM p.variants vActive WHERE vActive.isActive = true)
              AND (:hasCategoryFilter = false OR EXISTS (
                  SELECT 1
                  FROM p.categories c
                  WHERE c.id IN :categoryIds
              ))
              AND (
                  :search IS NULL OR :search = '' OR (
                      LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                      OR LOWER(p.webName) LIKE LOWER(CONCAT('%', :search, '%'))
                      OR LOWER(p.slug) LIKE LOWER(CONCAT('%', :search, '%'))
                      OR EXISTS (SELECT 1 FROM p.variants v3 WHERE LOWER(v3.sku) LIKE LOWER(CONCAT('%', :search, '%')))
                      OR EXISTS (SELECT 1 FROM p.categories c2 WHERE LOWER(c2.name) LIKE LOWER(CONCAT('%', :search, '%')))
                  )
              )
              AND (
                  (:minPrice IS NULL AND :maxPrice IS NULL)
                  OR EXISTS (
                      SELECT 1
                      FROM p.variants vPrice
                      WHERE vPrice.isActive = true
                        AND (:minPrice IS NULL OR vPrice.salePrice >= :minPrice)
                        AND (:maxPrice IS NULL OR vPrice.salePrice <= :maxPrice)
                  )
              )
            """)
    Page<UUID> findListProductIdsPriceLow(
            @Param("categoryIds") Collection<UUID> categoryIds,
            @Param("hasCategoryFilter") boolean hasCategoryFilter,
            @Param("search") String search,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            Pageable pageable);

    @Query(value = """
            SELECT p.id
            FROM ProductEntity p
            JOIN p.variants v
            WHERE v.isActive = true
              AND (:hasCategoryFilter = false OR EXISTS (
                  SELECT 1
                  FROM p.categories c
                  WHERE c.id IN :categoryIds
              ))
              AND (
                  :search IS NULL OR :search = '' OR (
                      LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                      OR LOWER(p.webName) LIKE LOWER(CONCAT('%', :search, '%'))
                      OR LOWER(p.slug) LIKE LOWER(CONCAT('%', :search, '%'))
                      OR EXISTS (SELECT 1 FROM p.variants v3 WHERE LOWER(v3.sku) LIKE LOWER(CONCAT('%', :search, '%')))
                      OR EXISTS (SELECT 1 FROM p.categories c2 WHERE LOWER(c2.name) LIKE LOWER(CONCAT('%', :search, '%')))
                  )
              )
              AND (
                  (:minPrice IS NULL AND :maxPrice IS NULL)
                  OR EXISTS (
                      SELECT 1
                      FROM p.variants vPrice
                      WHERE vPrice.isActive = true
                        AND (:minPrice IS NULL OR vPrice.salePrice >= :minPrice)
                        AND (:maxPrice IS NULL OR vPrice.salePrice <= :maxPrice)
                  )
              )
            GROUP BY p.id, p.updatedAt
            ORDER BY MIN(v.salePrice) DESC, p.updatedAt DESC, p.id DESC
            """, countQuery = """
            SELECT COUNT(DISTINCT p)
            FROM ProductEntity p
            WHERE EXISTS (SELECT 1 FROM p.variants vActive WHERE vActive.isActive = true)
              AND (:hasCategoryFilter = false OR EXISTS (
                  SELECT 1
                  FROM p.categories c
                  WHERE c.id IN :categoryIds
              ))
              AND (
                  :search IS NULL OR :search = '' OR (
                      LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                      OR LOWER(p.webName) LIKE LOWER(CONCAT('%', :search, '%'))
                      OR LOWER(p.slug) LIKE LOWER(CONCAT('%', :search, '%'))
                      OR EXISTS (SELECT 1 FROM p.variants v3 WHERE LOWER(v3.sku) LIKE LOWER(CONCAT('%', :search, '%')))
                      OR EXISTS (SELECT 1 FROM p.categories c2 WHERE LOWER(c2.name) LIKE LOWER(CONCAT('%', :search, '%')))
                  )
              )
              AND (
                  (:minPrice IS NULL AND :maxPrice IS NULL)
                  OR EXISTS (
                      SELECT 1
                      FROM p.variants vPrice
                      WHERE vPrice.isActive = true
                        AND (:minPrice IS NULL OR vPrice.salePrice >= :minPrice)
                        AND (:maxPrice IS NULL OR vPrice.salePrice <= :maxPrice)
                  )
              )
            """)
    Page<UUID> findListProductIdsPriceHigh(
            @Param("categoryIds") Collection<UUID> categoryIds,
            @Param("hasCategoryFilter") boolean hasCategoryFilter,
            @Param("search") String search,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            Pageable pageable);

    @Query("""
            SELECT DISTINCT p
            FROM ProductEntity p
            LEFT JOIN FETCH p.categories
            WHERE p.id IN :ids
            """)
    List<ProductEntity> findByIdInWithBaseDetails(@Param("ids") Collection<UUID> ids);

    @Query("""
            SELECT v
            FROM ProductVariantEntity v
            LEFT JOIN FETCH v.inventory
            WHERE v.product.id IN :productIds
            """)
    List<ProductVariantEntity> findVariantsByProductIds(@Param("productIds") Collection<UUID> productIds);

    @Query("""
            SELECT i
            FROM ProductImageEntity i
            WHERE i.product.id IN :productIds
            """)
    List<ProductImageEntity> findImagesByProductIds(@Param("productIds") Collection<UUID> productIds);

    @Query("""
            SELECT i
            FROM ProductIngredientEntity i
            WHERE i.product.id IN :productIds
            """)
    List<ProductIngredientEntity> findIngredientsByProductIds(@Param("productIds") Collection<UUID> productIds);

    @Query("""
            SELECT r.product.id as productId,
                   COALESCE(AVG(r.rating), 0) as averageRating,
                   COUNT(r) as totalReviews
            FROM ReviewEntity r
            WHERE r.product.id IN :productIds
            GROUP BY r.product.id
            """)
    List<ProductReviewStatsProjection> findReviewStatsByProductIds(@Param("productIds") Collection<UUID> productIds);

    interface ProductReviewStatsProjection {
        UUID getProductId();

        Double getAverageRating();

        Long getTotalReviews();
    }

    Page<ProductEntity> findDistinctByCategories_SlugIn(List<String> slugs, Pageable pageable);

    Page<ProductEntity> findByNameContainingIgnoreCase(String name, Pageable pageable);

    java.util.Optional<ProductEntity> findBySlug(String slug);

    @Query("SELECT p FROM ProductEntity p JOIN p.variants v WHERE v.sku = :sku")
    java.util.Optional<ProductEntity> findBySku(@Param("sku") String sku);

    List<ProductEntity> findByIdIn(Collection<UUID> ids);

    long countByCreatedAtBetween(java.time.Instant startOfDay, java.time.Instant endOfDay);

    long countByCreatedAtBefore(java.time.Instant endExclusive);

    long countByIsActiveTrue();

    long countByIsActiveTrueAndCreatedAtBefore(java.time.Instant endExclusive);
}
