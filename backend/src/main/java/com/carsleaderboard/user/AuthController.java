package com.carsleaderboard.user;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private final CurrentUserResolver currentUserResolver;

    public AuthController(CurrentUserResolver currentUserResolver) {
        this.currentUserResolver = currentUserResolver;
    }

    public record MeResponse(boolean authenticated, User user) {}

    @GetMapping("/api/auth/me")
    public MeResponse me(@AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserResolver.resolve(principal);
        return new MeResponse(user != null, user);
    }
}
