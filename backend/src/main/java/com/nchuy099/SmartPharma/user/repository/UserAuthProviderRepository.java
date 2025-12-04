package com.nchuy099.SmartPharma.user.repository;

import com.nchuy099.SmartPharma.user.entity.UserAuthProviderEntity;
import com.nchuy099.SmartPharma.user.enums.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserAuthProviderRepository extends JpaRepository<UserAuthProviderEntity, UUID> {
    Optional<UserAuthProviderEntity> findByProviderAndProviderUserId(AuthProvider provider, String providerUserId);

    Optional<UserAuthProviderEntity> findByUserIdAndProvider(UUID userId, AuthProvider provider);
}
