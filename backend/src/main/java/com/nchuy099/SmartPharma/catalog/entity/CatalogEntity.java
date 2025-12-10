package com.nchuy099.SmartPharma.catalog.entity;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "catalogs", uniqueConstraints = {
        @UniqueConstraint(name = "uk_catalogs_type_code", columnNames = {"type", "code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CatalogEntity extends AbstractEntity {
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    CatalogType type;

    @Column(nullable = false, length = 100)
    String code;

    @Column(nullable = false, length = 255)
    String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    CatalogEntity parent;

    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    @Builder.Default
    Set<CatalogEntity> children = new HashSet<>();

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    Boolean isActive = true;
}
