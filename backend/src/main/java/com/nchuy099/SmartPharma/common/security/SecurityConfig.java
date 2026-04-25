package com.nchuy099.SmartPharma.common.security;

import java.util.List;
import org.springframework.core.convert.converter.Converter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;
    private final CustomJwtDecoder customJwtDecoder;
    private final Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oauth2AuthenticationSuccessHandler;
    private final OAuth2AuthenticationFailureHandler oauth2AuthenticationFailureHandler;

    private static final String[] PUBLIC_ENDPOINTS = {
            "/auth/sign-up",
            "/auth/login",
            "/auth/refresh-token",
            "/auth/forgot-password",
            "/auth/reset-password",
            "/internal/webhook/image-processed",
            "/api/internal/webhook/image-processed",
            "/internal/sepay/webhook",
            "/api/internal/sepay/webhook",
            "/products/**",
            "/categories/**",
            "/flash-sales/active",
            "/flash-sales/active/**",
            "/flash-sales/campaigns",
            "/flash-sales/campaigns/**",
            "/flash-sales/events",
            "/flash-sales/events/**",
            "/catalogs/locations/**",
            "/reviews/products/**",
            "/events/**",
            "/ws/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/swagger-resources/**",
            "/webjars/**"
    };

    @Bean
    @Order(1)
    public SecurityFilterChain swaggerSecurityChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .securityMatcher(PUBLIC_ENDPOINTS)
                .csrf(csrf -> csrf.disable())
                .oauth2ResourceServer(oauth2 -> oauth2.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.decoder(customJwtDecoder)
                                .jwtAuthenticationConverter(jwtAuthenticationConverter))
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oauth2AuthenticationSuccessHandler)
                        .failureHandler(oauth2AuthenticationFailureHandler))
                        .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .requestMatchers("/recommendations", "/recommendations/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/chat/rooms").permitAll()
                        .requestMatchers(HttpMethod.POST, "/chat/ai").authenticated()
                        .requestMatchers("/flash-sales/active", "/flash-sales/active/**", "/flash-sales/campaigns", "/flash-sales/campaigns/**", "/flash-sales/events", "/flash-sales/events/**").permitAll()
                        // User endpoints
                        .requestMatchers("/users/me/**", "/carts/**", "/orders/**", "/checkout/**", "/reviews/**", "/flash-sales/**")
                        .authenticated()
                        .requestMatchers("/chat/**").authenticated()

                        // Pharmacist endpoints
                        .requestMatchers("/pharmacists/**", "/pharmacist/**").authenticated()

                        // Admin endpoints are authenticated here; fine-grained authorization stays in controllers.
                        .requestMatchers("/admin/**").authenticated()
                        
                        .anyRequest().authenticated())
                .exceptionHandling(exceptionHandling -> exceptionHandling
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler));
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder getPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }

}
