package com.nchuy099.SmartPharma.product.repository;

import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariantEntity, UUID> {

    List<ProductVariantEntity> findByProductId(UUID productId);

    Optional<ProductVariantEntity> findBySku(String sku);


    List<ProductVariantEntity> findByProductIdAndIsActiveTrue(UUID productId);

    @Query("SELECT v FROM ProductVariantEntity v JOIN FETCH v.product p WHERE v.id = :id")
    Optional<ProductVariantEntity> findByIdWithProduct(@Param("id") UUID id);
}
