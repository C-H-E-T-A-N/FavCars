package com.carsleaderboard.car;

import com.carsleaderboard.car.dto.CarSummaryDto;
import com.carsleaderboard.car.dto.PageResponse;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cars")
public class CarController {

    private final CarService carService;

    public CarController(CarService carService) {
        this.carService = carService;
    }

    @GetMapping
    public PageResponse<CarSummaryDto> getCars(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "30") @Min(1) int size) {
        return PageResponse.of(carService.getCars(page, size).map(CarSummaryDto::from));
    }

    @GetMapping("/{id}")
    public Car getCar(@PathVariable String id) {
        return carService.getCarById(id);
    }

    @GetMapping("/search")
    public PageResponse<CarSummaryDto> search(
            @RequestParam @NotBlank String q,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "30") @Min(1) int size) {
        return PageResponse.of(carService.search(q, page, size).map(CarSummaryDto::from));
    }
}
