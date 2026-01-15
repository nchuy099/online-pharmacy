package com.nchuy099.SmartPharma.user.entity;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.user.enums.RoleType;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Column;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Entity
@Table(name = "roles")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoleEntity extends AbstractEntity {

    String name;

    String description;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false)
    RoleType roleType = RoleType.ADMIN;
    @Builder.Default
    @Column(name = "is_protected", nullable = false)
    Boolean protectedRole = Boolean.FALSE;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "role_permissions",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id"))
    @Builder.Default
    Set<PermissionEntity> permissions = new HashSet<>();

    @OneToMany(mappedBy = "role")
    List<UserEntity> users;
}
