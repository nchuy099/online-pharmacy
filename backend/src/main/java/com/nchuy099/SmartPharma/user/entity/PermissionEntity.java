package com.nchuy099.SmartPharma.user.entity;

import java.util.HashSet;
import java.util.Set;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.user.enums.RoleType;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "permissions")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PermissionEntity extends AbstractEntity {

    String name;

    String description;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false)
    RoleType roleType = RoleType.ADMIN;

    @Builder.Default
    @Column(name = "is_critical", nullable = false)
    Boolean critical = Boolean.FALSE;

    @Builder.Default
    @Column(name = "is_assignable", nullable = false)
    Boolean assignable = Boolean.TRUE;

    @ManyToMany(mappedBy = "permissions", fetch = FetchType.LAZY)
    @Builder.Default
    Set<RoleEntity> roles = new HashSet<>();
}
