package com.nchuy099.SmartPharma.common.utils;

import java.util.UUID;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    public UUID getCurrentUserId() {
        Authentication auth = getCurrentAuthentication();

        if (auth == null) {
            throw new IllegalStateException("No authentication in security context");
        }

        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            return UUID.fromString(jwtAuth.getToken().getSubject());
        }

        return UUID.fromString(auth.getName());
    }

    public Optional<UUID> getCurrentUserIdIfPresent() {
        Authentication auth = getCurrentAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }

        try {
            if (auth instanceof JwtAuthenticationToken jwtAuth) {
                return Optional.of(UUID.fromString(jwtAuth.getToken().getSubject()));
            }

            return Optional.of(UUID.fromString(auth.getName()));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    public boolean hasRole(String roleName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + roleName));
    }

    public boolean hasPermission(String permissionName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(permissionName));
    }

    private Authentication getCurrentAuthentication() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        return securityContext != null ? securityContext.getAuthentication() : null;
    }
}
