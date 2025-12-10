package com.nchuy099.SmartPharma.product.entity;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderItemEntity;
import org.hibernate.annotations.BatchSize;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Entity
@Table(name = "products")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductEntity extends AbstractEntity {

    @Column(nullable = false, unique = true)
    String code;

    @Column(nullable = false, unique = true)
    String slug;

    @jakarta.persistence.Column(nullable = false, columnDefinition = "TEXT")
    String name;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    String webName;

    String brand;

    String brandOrigin;

    String producer;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(columnDefinition = "TEXT")
    String careful;

    @Column(columnDefinition = "TEXT")
    String adverseEffect;

    @Column(columnDefinition = "TEXT")
    String preservation;

    @Column(columnDefinition = "TEXT")
    String usage;

    @Column(columnDefinition = "TEXT")
    String dosage;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @BatchSize(size = 20)
    List<ProductVariantEntity> variants = new ArrayList<>();

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    Boolean isActive = true;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<ProductIngredientEntity> ingredient = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<ProductImageEntity> images = new ArrayList<>();

    @ManyToMany
    @JoinTable(name = "product_category",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    @BatchSize(size = 20)
    private Set<CategoryEntity> categories = new HashSet<>();

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    List<OrderItemEntity> orderItems;

    public String getPrimaryImage() {
        if (images == null || images.isEmpty()) {
            return null;
        }

        return images.stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .map(ProductImageEntity::getUrl)
                .findFirst()
                .orElse(images.get(0).getUrl());
    }

    public void setPrimaryImage(String primaryImage) {
        if (images == null) {
            images = new ArrayList<>();
        }

        images.removeIf(img -> Boolean.TRUE.equals(img.getIsPrimary()));

        if (primaryImage != null && !primaryImage.trim().isEmpty()) {
            images.add(ProductImageEntity.builder()
                    .url(primaryImage.trim())
                    .isPrimary(true)
                    .product(this)
                    .build());
        }
    }
}
