package com.nchuy099.SmartPharma.user.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.nchuy099.SmartPharma.cart.entity.CartEntity;
import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.chat.entity.ChatConversationEntity;
import com.nchuy099.SmartPharma.token.entity.RefreshToken;
import com.nchuy099.SmartPharma.token.entity.ResetPasswordToken;
import com.nchuy099.SmartPharma.user.enums.UserStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Entity
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserEntity extends AbstractEntity {

    @Email
    @Column(unique = true)
    String email;

    @Column(unique = true, nullable = true, length = 15)
    String phoneNumber;

    String fullName;

    String password;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    UserStatus status = UserStatus.ACTIVE;

    @Column(nullable = true)
    String biography;

    @Column(nullable = true)
    LocalDate dateOfBirth;

    @Column(nullable = true)
    String gender;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @Builder.Default
    List<RefreshToken> refreshTokens = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @Builder.Default
    List<ResetPasswordToken> resetPasswordTokens = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<AvatarEntity> avatars = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    RoleEntity role;

    @OneToOne(mappedBy = "user", cascade = { CascadeType.MERGE, CascadeType.REMOVE }, orphanRemoval = true)
    CartEntity cart;

    @OneToMany(mappedBy = "user")
    @Builder.Default
    List<OrderEntity> orders = new ArrayList<>();
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<ChatConversationEntity> chatConversations = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<AddressEntity> addresses = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<UserAuthProviderEntity> authProviders = new ArrayList<>();
}
