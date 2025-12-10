package com.nchuy099.SmartPharma.product.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateCategoryRequest {
    String name;
    String parentId;
    int level;
    Boolean isActive;
}
