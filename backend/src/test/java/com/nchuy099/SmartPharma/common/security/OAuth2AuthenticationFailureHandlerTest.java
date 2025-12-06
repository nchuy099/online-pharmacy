package com.nchuy099.SmartPharma.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.test.util.ReflectionTestUtils;

class OAuth2AuthenticationFailureHandlerTest {

    private OAuth2AuthenticationFailureHandler handler;

    @BeforeEach
    void setUp() {
        handler = new OAuth2AuthenticationFailureHandler();
        ReflectionTestUtils.setField(handler, "frontendUrl", "http://localhost:5173");
    }

    @Test
    void redirectsToLoginWithCancelledErrorWhenUserDeniesConsent() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.onAuthenticationFailure(request, response,
                new OAuth2AuthenticationException(new OAuth2Error("access_denied")));

        assertThat(response.getRedirectedUrl())
                .isEqualTo("http://localhost:5173/login?error=oauth2_cancelled");
    }

    @Test
    void redirectsToLoginWithGenericErrorForOtherFailures() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.onAuthenticationFailure(request, response,
                new OAuth2AuthenticationException(new OAuth2Error("invalid_request")));

        assertThat(response.getRedirectedUrl())
                .isEqualTo("http://localhost:5173/login?error=oauth2_failed");
    }
}
