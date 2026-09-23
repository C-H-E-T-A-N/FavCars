package com.carsleaderboard.user;

import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * On every Google login: find the user by their stable Google "sub" id, or create one.
 * We never see or store the Google password - Google is purely the identity provider.
 *
 * Google's login uses OpenID Connect (the "openid" scope), so Spring Security routes it through
 * OidcUserService rather than the plain OAuth2 UserService - extending the wrong base class here
 * means this method silently never runs (login still "succeeds", but no User document is ever
 * created, so every session looks unauthenticated to the rest of the app).
 */
@Service
public class CustomOAuth2UserService extends OidcUserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        String googleId = oidcUser.getAttribute("sub");
        String email = oidcUser.getAttribute("email");
        String name = oidcUser.getAttribute("name");
        String picture = oidcUser.getAttribute("picture");

        User user = userRepository.findByGoogleId(googleId).orElseGet(() -> {
            User u = new User();
            u.setGoogleId(googleId);
            u.setCreatedAt(Instant.now());
            return u;
        });
        user.setEmail(email);
        user.setName(name);
        user.setProfileImage(picture);
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return oidcUser;
    }
}
