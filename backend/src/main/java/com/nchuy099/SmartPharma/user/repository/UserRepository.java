package com.nchuy099.SmartPharma.user.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.user.entity.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID>, JpaSpecificationExecutor<UserEntity> {
    interface UserRoleCountProjection {
        String getRoleName();
        long getTotal();
    }

    Optional<UserEntity> findByPhoneNumber(String phoneNumber);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM UserEntity u JOIN FETCH u.role WHERE u.email = :email")
    Optional<UserEntity> findByEmailWithRole(String email);

    @EntityGraph(attributePaths = { "role", "role.permissions" })
    @org.springframework.data.jpa.repository.Query("SELECT u FROM UserEntity u WHERE u.email = :email")
    Optional<UserEntity> findByEmailWithRolePermissions(String email);

    @EntityGraph(attributePaths = { "role", "role.permissions" })
    @org.springframework.data.jpa.repository.Query("SELECT u FROM UserEntity u WHERE u.id = :id")
    Optional<UserEntity> findByIdWithRolePermissions(UUID id);

    @EntityGraph(attributePaths = { "role", "role.permissions", "avatars" })
    @org.springframework.data.jpa.repository.Query("SELECT u FROM UserEntity u WHERE u.id = :id")
    Optional<UserEntity> findByIdWithRolePermissionsAndAvatars(UUID id);

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByPhoneNumberOrEmail(String phoneNumber, String email);

    long countByCreatedAtBetween(java.time.Instant startOfDay, java.time.Instant endOfDay);

    long countByCreatedAtBefore(java.time.Instant endExclusive);

    java.util.List<UserEntity> findByRole(com.nchuy099.SmartPharma.user.entity.RoleEntity role);

    long countByRole_NameIgnoreCase(String name);

    @org.springframework.data.jpa.repository.Query("""
            SELECT r.name as roleName, COUNT(u) as total
            FROM UserEntity u
            JOIN u.role r
            GROUP BY r.name
            """)
    java.util.List<UserRoleCountProjection> countUsersByRole();
}
