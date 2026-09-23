package com.carsleaderboard.leaderboard;

import com.carsleaderboard.car.Car;
import com.carsleaderboard.car.CarRepository;
import com.carsleaderboard.car.dto.CarSummaryDto;
import com.carsleaderboard.car.dto.PageResponse;
import com.carsleaderboard.leaderboard.dto.LeaderboardEntryDto;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final CarRepository carRepository;

    public LeaderboardController(LeaderboardService leaderboardService, CarRepository carRepository) {
        this.leaderboardService = leaderboardService;
        this.carRepository = carRepository;
    }

    @GetMapping("/api/leaderboard")
    public PageResponse<LeaderboardEntryDto> leaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        long start = (long) page * size;
        long end = start + size - 1;

        // ZREVRANGE leaderboard:global start end WITHSCORES - the ranking itself never touches Mongo.
        Set<ZSetOperations.TypedTuple<String>> topRange = leaderboardService.getTopRange(start, end);
        List<ZSetOperations.TypedTuple<String>> ranked = topRange == null ? List.of() : List.copyOf(topRange);

        List<String> carIds = ranked.stream().map(ZSetOperations.TypedTuple::getValue).toList();
        Map<String, Car> carsById = new HashMap<>();
        for (Car car : carRepository.findAllById(carIds)) {
            carsById.put(car.getId(), car);
        }

        List<LeaderboardEntryDto> content = new ArrayList<>();
        for (int i = 0; i < ranked.size(); i++) {
            ZSetOperations.TypedTuple<String> entry = ranked.get(i);
            Car car = carsById.get(entry.getValue());
            if (car == null) continue; // leaderboard member whose car was deleted since sync - skip rather than 500
            long rank = start + i + 1;
            long votes = entry.getScore() != null ? entry.getScore().longValue() : 0;
            content.add(new LeaderboardEntryDto(rank, CarSummaryDto.from(car), votes));
        }

        long totalElements = leaderboardService.size();
        int totalPages = size == 0 ? 0 : (int) Math.ceil(totalElements / (double) size);
        return new PageResponse<>(content, page, size, totalElements, totalPages);
    }
}
