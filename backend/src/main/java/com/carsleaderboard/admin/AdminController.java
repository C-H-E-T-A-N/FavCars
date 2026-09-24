package com.carsleaderboard.admin;

import com.carsleaderboard.car.Car;
import com.carsleaderboard.car.CarRepository;
import com.carsleaderboard.car.CarService;
import com.carsleaderboard.car.dto.PageResponse;
import com.carsleaderboard.carrequest.CarRequest;
import com.carsleaderboard.carrequest.CarRequestRepository;
import com.carsleaderboard.leaderboard.LeaderboardService;
import com.carsleaderboard.user.CurrentUserResolver;
import com.carsleaderboard.user.User;
import com.carsleaderboard.user.UserRepository;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/**
 * Dashboard for the one admin account (app.admin-email). Every method re-checks the caller's role
 * server-side - the frontend hiding the "Admin" link is a convenience, not the actual gate.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final CarRepository carRepository;
    private final CarService carService;
    private final CarRequestRepository carRequestRepository;
    private final UserRepository userRepository;
    private final LeaderboardService leaderboardService;
    private final CurrentUserResolver currentUserResolver;

    @Value("${app.upload-dir}")
    private String uploadDir;

    public AdminController(CarRepository carRepository, CarService carService, CarRequestRepository carRequestRepository,
                            UserRepository userRepository, LeaderboardService leaderboardService,
                            CurrentUserResolver currentUserResolver) {
        this.carRepository = carRepository;
        this.carService = carService;
        this.carRequestRepository = carRequestRepository;
        this.userRepository = userRepository;
        this.leaderboardService = leaderboardService;
        this.currentUserResolver = currentUserResolver;
    }

    private void requireAdmin(OAuth2User principal) {
        User user = currentUserResolver.resolve(principal);
        if (user == null || !"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }

    public record AdminStatsResponse(long totalCars, long totalUsers, long pendingRequests) {}

    @GetMapping("/stats")
    public AdminStatsResponse stats(@AuthenticationPrincipal OAuth2User principal) {
        requireAdmin(principal);
        long pending = carRequestRepository.findByStatus("PENDING", PageRequest.of(0, 1)).getTotalElements();
        return new AdminStatsResponse(carRepository.count(), userRepository.count(), pending);
    }

    @GetMapping("/cars")
    public PageResponse<Car> listCars(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "25") @Min(1) int size,
            @AuthenticationPrincipal OAuth2User principal) {
        requireAdmin(principal);
        if (q != null && !q.isBlank()) {
            return PageResponse.of(carService.search(q, page, size));
        }
        return PageResponse.of(carService.getCars(page, size));
    }

    public record UploadResponse(String url) {}

    /** Saves the file into upload-dir (alongside the existing seed-car images) and hands back the
     *  /images/... URL to put in a car's image.url - it doesn't touch any Car document itself. */
    @PostMapping("/uploads")
    public UploadResponse uploadImage(@RequestParam("file") MultipartFile file, @AuthenticationPrincipal OAuth2User principal) {
        requireAdmin(principal);
        if (file.isEmpty() || !ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Upload a JPEG, PNG, WebP, or GIF image");
        }
        String ext = switch (file.getContentType()) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".gif";
        };
        String filename = UUID.randomUUID() + ext;
        try {
            Path dir = Path.of(uploadDir);
            Files.createDirectories(dir);
            file.transferTo(dir.resolve(filename));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the image", e);
        }
        return new UploadResponse("/images/" + filename);
    }

    @PostMapping("/cars")
    @ResponseStatus(HttpStatus.CREATED)
    public Car createCar(@RequestBody Car body, @AuthenticationPrincipal OAuth2User principal) {
        requireAdmin(principal);
        body.setId(null);
        body.setExternalId("manual/" + UUID.randomUUID());
        body.setSource("manual");
        body.setCreatedAt(Instant.now());
        body.setUpdatedAt(Instant.now());
        Car saved = carRepository.save(body);
        leaderboardService.initializeIfAbsent(saved.getId(), saved.getVoteCount());
        return saved;
    }

    @PutMapping("/cars/{id}")
    public Car updateCar(@PathVariable String id, @RequestBody Car body, @AuthenticationPrincipal OAuth2User principal) {
        requireAdmin(principal);
        Car existing = carRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found: " + id));

        existing.setMake(body.getMake());
        existing.setMakeSlug(body.getMakeSlug());
        existing.setModel(body.getModel());
        existing.setModelSlug(body.getModelSlug());
        existing.setYear(body.getYear());
        existing.setVariant(body.getVariant());
        existing.setCountry(body.getCountry());
        existing.setBodyType(body.getBodyType());
        existing.setFuelType(body.getFuelType());
        existing.setTransmission(body.getTransmission());
        existing.setDrivetrain(body.getDrivetrain());
        existing.setEngine(body.getEngine());
        existing.setImage(body.getImage());
        existing.setAvailability(body.getAvailability());
        existing.setVoteCount(body.getVoteCount());
        existing.setUpdatedAt(Instant.now());

        Car saved = carRepository.save(existing);
        leaderboardService.setScore(saved.getId(), saved.getVoteCount());
        return saved;
    }

    @DeleteMapping("/cars/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCar(@PathVariable String id, @AuthenticationPrincipal OAuth2User principal) {
        requireAdmin(principal);
        carRepository.deleteById(id);
        leaderboardService.remove(id);
    }

    @GetMapping("/car-requests")
    public PageResponse<CarRequest> listCarRequests(
            @RequestParam(defaultValue = "PENDING") String status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "25") @Min(1) int size,
            @AuthenticationPrincipal OAuth2User principal) {
        requireAdmin(principal);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PageResponse.of(carRequestRepository.findByStatus(status.toUpperCase(), pageable));
    }

    @PostMapping("/car-requests/{id}/approve")
    public Car approveCarRequest(@PathVariable String id, @AuthenticationPrincipal OAuth2User principal) {
        requireAdmin(principal);
        CarRequest request = carRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found: " + id));

        Car car = new Car();
        car.setExternalId("request/" + request.getId());
        car.setMake(request.getMake());
        car.setModel(request.getModel());
        car.setYear(request.getYear());
        car.setSource("user-request");
        car.setCreatedAt(Instant.now());
        car.setUpdatedAt(Instant.now());
        Car saved = carRepository.save(car);
        leaderboardService.initializeIfAbsent(saved.getId(), 0);

        request.setStatus("APPROVED");
        request.setReviewedAt(Instant.now());
        carRequestRepository.save(request);
        return saved;
    }

    @PostMapping("/car-requests/{id}/reject")
    public CarRequest rejectCarRequest(@PathVariable String id, @AuthenticationPrincipal OAuth2User principal) {
        requireAdmin(principal);
        CarRequest request = carRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found: " + id));
        request.setStatus("REJECTED");
        request.setReviewedAt(Instant.now());
        return carRequestRepository.save(request);
    }
}
