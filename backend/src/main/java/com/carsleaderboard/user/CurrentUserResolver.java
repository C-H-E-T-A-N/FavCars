package com.carsleaderboard.user;

import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserResolver {

    private final UserRepository userRepository;

    public CurrentUserResolver(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Null if there's no session, or (defensively) if the session's Google id has no matching User yet. */
    public User resolve(OAuth2User principal) {
        if (principal == null) {
            return null;
        }
        String googleId = principal.getAttribute("sub");
        return userRepository.findByGoogleId(googleId).orElse(null);
    }
}
