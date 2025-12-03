package com.nchuy099.SmartPharma.common.security;

import java.util.Collection;
import java.util.List;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.user.entity.PermissionEntity;
import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.enums.UserStatus;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UserRepository userRepository;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        UUID userId = parseUuid(jwt.getSubject(), "subject");
        UUID tokenRoleId = parseUuid(jwt.getClaimAsString("roleId"), "roleId");

        UserEntity user = userRepository.findByIdWithRolePermissions(userId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED, "User not found"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.USER_LOCKED, "Tài khoản đã bị khóa");
        }

        RoleEntity role = user.getRole();
        if (role == null || role.getId() == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "User role not found");
        }

        if (!role.getId().equals(tokenRoleId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Token role mismatch");
        }

        Collection<GrantedAuthority> authorities = buildAuthorities(role);
        return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
    }

    private Collection<GrantedAuthority> buildAuthorities(RoleEntity role) {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();
        if (role.getPermissions() != null) {
            authorities.addAll(role.getPermissions().stream()
                    .map(PermissionEntity::getName)
                    .filter(StringUtils::hasText)
                    .map(permission -> new SimpleGrantedAuthority(permission.trim().toUpperCase()))
                    .collect(Collectors.toCollection(LinkedHashSet::new)));
        }

        String roleName = role.getName();
        if (StringUtils.hasText(roleName)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName.trim().toUpperCase()));
        }
        return List.copyOf(authorities);
    }

    private UUID parseUuid(String value, String claimName) {
        if (!StringUtils.hasText(value)) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Missing JWT claim: " + claimName);
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Invalid JWT claim: " + claimName);
        }
    }
}
