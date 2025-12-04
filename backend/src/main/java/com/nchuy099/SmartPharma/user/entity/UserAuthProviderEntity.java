package com.nchuy099.SmartPharma.user.entity;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.user.enums.AuthProvider;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(
        name = "user_auth_providers",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_auth_providers_user_provider", columnNames = {"user_id", "provider"}),
                @UniqueConstraint(name = "uk_user_auth_providers_provider_provider_user_id", columnNames = {"provider", "provider_user_id"})
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserAuthProviderEntity extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    AuthProvider provider;

    @Column(name = "provider_user_id", length = 255)
    String providerUserId;

    @Column(name = "email_at_provider", length = 255)
    String emailAtProvider;
}
