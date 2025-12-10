package com.nchuy099.SmartPharma.product.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.product.entity.CategoryEntity;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, UUID> {
        @Query("SELECT c FROM CategoryEntity c LEFT JOIN FETCH c.parent WHERE c.isActive = :isActive")
        List<CategoryEntity> findAllByIsActive(@Param("isActive") boolean isActive);


        java.util.Optional<CategoryEntity> findBySlug(String slug);

        @Query(value = """
                        WITH RECURSIVE category_tree AS (
                            SELECT id
                            FROM categories
                            WHERE id = :rootId
                            UNION ALL
                            SELECT c.id
                            FROM categories c
                            JOIN category_tree ct ON c.parent_id = ct.id
                        )
                        SELECT id FROM category_tree
                        """, nativeQuery = true)
        List<UUID> findDescendantIds(@Param("rootId") UUID rootId);

        boolean existsByCode(String code);

        @Query(value = """
                        SELECT c FROM CategoryEntity c
                        WHERE (cast(:search as string) IS NULL OR LOWER(c.name) LIKE :search OR LOWER(c.slug) LIKE :search)
                        AND (cast(:level as integer) IS NULL OR c.level = :level)
                        AND (cast(:active as boolean) IS NULL OR c.isActive = :active)
                        """, countQuery = """
                        SELECT COUNT(c) FROM CategoryEntity c
                        WHERE (cast(:search as string) IS NULL OR LOWER(c.name) LIKE :search OR LOWER(c.slug) LIKE :search)
                        AND (cast(:level as integer) IS NULL OR c.level = :level)
                        AND (cast(:active as boolean) IS NULL OR c.isActive = :active)
                        """)
        Page<CategoryEntity> searchCategories(
                        @Param("search") String search,
                        @Param("level") Integer level,
                        @Param("active") Boolean active,
                        Pageable pageable);

        @Query("SELECT c.id as categoryId, COUNT(p) as productCount FROM CategoryEntity c LEFT JOIN c.products p WHERE c.id IN :ids GROUP BY c.id")
        List<CategoryProductCount> findProductCountsByIds(@Param("ids") List<UUID> ids);

        @Query("SELECT c.id as categoryId, COUNT(p) as productCount FROM CategoryEntity c LEFT JOIN c.products p GROUP BY c.id")
        List<CategoryProductCount> findAllProductCounts();


        interface CategoryProductCount {
                UUID getCategoryId();
                Long getProductCount();
        }
}
