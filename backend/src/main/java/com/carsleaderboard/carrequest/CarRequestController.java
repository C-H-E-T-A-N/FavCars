package com.carsleaderboard.carrequest;

import com.carsleaderboard.user.CurrentUserResolver;
import com.carsleaderboard.user.User;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

/** The "+ Request a Car" form - anyone signed in can submit one; an admin approves/rejects it. */
@RestController
public class CarRequestController {

    private final CarRequestRepository carRequestRepository;
    private final CurrentUserResolver currentUserResolver;

    public CarRequestController(CarRequestRepository carRequestRepository, CurrentUserResolver currentUserResolver) {
        this.carRequestRepository = carRequestRepository;
        this.currentUserResolver = currentUserResolver;
    }

    public record CarRequestSubmission(@NotBlank String make, @NotBlank String model, Integer year, String note) {}

    @PostMapping("/api/car-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public CarRequest submit(@RequestBody CarRequestSubmission body, @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserResolver.resolve(principal);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to request a car");
        }

        CarRequest request = new CarRequest();
        request.setMake(body.make().trim());
        request.setModel(body.model().trim());
        request.setYear(body.year());
        request.setNote(body.note());
        request.setRequestedByEmail(user.getEmail());
        request.setRequestedByName(user.getName());
        request.setStatus("PENDING");
        request.setCreatedAt(Instant.now());
        return carRequestRepository.save(request);
    }
}
