package com.nchuy099.SmartPharma.product.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CategoryResponse {
    String id;
    String code;
    String slug;
    String name;
    String parentId;
    int level;
    Boolean isActive;
    long productCount;

    @Builder.Default
    java.util.List<CategoryResponse> children = new java.util.ArrayList<>();
}
