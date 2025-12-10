package com.nchuy099.SmartPharma.product.entity;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "product_ingredients")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductIngredientEntity extends AbstractEntity {

    Long ingredientId;
    @jakarta.persistence.Column(columnDefinition = "TEXT")
    String name;
    @jakarta.persistence.Column(columnDefinition = "TEXT")
    String shortDescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    ProductEntity product;
}
