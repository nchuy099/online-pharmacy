package com.nchuy099.SmartPharma.catalog.dto;

import com.nchuy099.SmartPharma.catalog.entity.CatalogType;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CatalogOptionResponse {
    String id;
    CatalogType type;
    String code;
    String name;
    String parentId;
    String parentCode;
    String parentName;
}
