package com.nchuy099.SmartPharma.common.security;

import com.nchuy099.SmartPharma.cart.entity.CartEntity;
import com.nchuy099.SmartPharma.cart.repository.CartRepository;
import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.entity.UserAuthProviderEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.enums.AuthProvider;
import com.nchuy099.SmartPharma.user.repository.RoleRepository;
import com.nchuy099.SmartPharma.user.repository.UserAuthProviderRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CartRepository cartRepository;
    private final UserAuthProviderRepository userAuthProviderRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);

        try {
            return processOAuth2User(oAuth2UserRequest, oAuth2User);
        } catch (Exception ex) {
            log.error("Error processing OAuth2 user", ex);
            throw new OAuth2AuthenticationException(ex.getMessage());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest oAuth2UserRequest, OAuth2User oAuth2User) {
        String registrationId = oAuth2UserRequest.getClientRegistration().getRegistrationId();
        AuthProvider authProvider = AuthProvider.valueOf(registrationId.toUpperCase());

        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String providerUserId = oAuth2User.getName();

        if (email == null) {
            throw new RuntimeException("Email not found from OAuth2 provider");
        }

        if (providerUserId == null) {
            throw new RuntimeException("Provider user id not found from OAuth2 provider");
        }

        Optional<UserAuthProviderEntity> existingProviderLink =
                userAuthProviderRepository.findByProviderAndProviderUserId(authProvider, providerUserId);

        UserEntity user;
        if (existingProviderLink.isPresent()) {
            user = existingProviderLink.get().getUser();

            if (!email.equalsIgnoreCase(user.getEmail())) {
                throw new RuntimeException(
                        "OAuth2 account conflict: provider identity is already linked to a different email.");
            }

            user = updateExistingUser(user, name);
        } else {
            user = userRepository.findByEmailWithRole(email)
                    .orElseGet(() -> registerNewUser(email, name));

            ensureProviderLink(user, authProvider, providerUserId, email);
            user = updateExistingUser(user, name);
        }

        return oAuth2User;
    }

    private UserEntity registerNewUser(String email, String name) {
        RoleEntity customerRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new RuntimeException("Default role CUSTOMER not found"));

        UserEntity user = UserEntity.builder()
                .email(email)
                .fullName(name)
                .role(customerRole)
                .build();

        user = userRepository.save(user);

        // Create cart for new user
        CartEntity cart = CartEntity.builder()
                .user(user)
                .build();
        cartRepository.save(cart);

        return user;
    }

    private void ensureProviderLink(UserEntity user, AuthProvider provider, String providerUserId, String emailAtProvider) {
        Optional<UserAuthProviderEntity> userProvider = userAuthProviderRepository.findByUserIdAndProvider(user.getId(), provider);

        if (userProvider.isPresent()) {
            UserAuthProviderEntity existing = userProvider.get();
            if (!Objects.equals(existing.getProviderUserId(), providerUserId)) {
                throw new RuntimeException("This provider is already linked to your account with a different identity.");
            }

            if (!Objects.equals(existing.getEmailAtProvider(), emailAtProvider)) {
                existing.setEmailAtProvider(emailAtProvider);
                userAuthProviderRepository.save(existing);
            }
            return;
        }

        UserAuthProviderEntity authProviderLink = UserAuthProviderEntity.builder()
                .user(user)
                .provider(provider)
                .providerUserId(providerUserId)
                .emailAtProvider(emailAtProvider)
                .build();

        userAuthProviderRepository.save(authProviderLink);
    }

    private UserEntity updateExistingUser(UserEntity existingUser, String name) {
        existingUser.setFullName(name);
        return userRepository.save(existingUser);
    }
}
