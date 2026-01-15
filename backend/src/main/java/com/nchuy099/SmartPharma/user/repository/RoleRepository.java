package com.nchuy099.SmartPharma.user.repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.enums.RoleType;

@Repository
public interface RoleRepository extends JpaRepository<RoleEntity, UUID> {
    Optional<RoleEntity> findByName(String name);

    Optional<RoleEntity> findByNameIgnoreCase(String name);

    @EntityGraph(attributePaths = { "permissions" })
    Optional<RoleEntity> findWithPermissionsByNameIgnoreCase(String name);

    List<RoleEntity> findByRoleType(RoleType roleType, Sort sort);
}
