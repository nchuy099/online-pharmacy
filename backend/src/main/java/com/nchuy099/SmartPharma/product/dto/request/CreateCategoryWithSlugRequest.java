package com.nchuy099.SmartPharma.product.dto.request;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateCategoryWithSlugRequest {
    String name;
    String slug;
    String parentId;
    int level;
    Boolean isActive;
}
