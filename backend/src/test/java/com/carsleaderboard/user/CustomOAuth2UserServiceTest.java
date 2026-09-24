package com.carsleaderboard.user;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Google login uses OpenID Connect, so Spring Security only invokes a userInfoEndpoint service
 * configured via oidcUserService(...) - a service wired via userService(...) (for a plain OAuth2
 * DefaultOAuth2UserService) is silently never called for Google logins. That bug shipped once
 * already (auth "succeeded" - session, cookie, everything - but no User document was ever created,
 * so the app looked permanently logged out). This test pins the fix: the class must extend
 * OidcUserService, or SecurityConfig's oidcUserService(customOAuth2UserService) won't compile/wire.
 */
class CustomOAuth2UserServiceTest {

    @Test
    void mustExtendOidcUserServiceNotPlainOAuth2UserService() {
        assertThat(OidcUserService.class).isAssignableFrom(CustomOAuth2UserService.class);
    }
}
