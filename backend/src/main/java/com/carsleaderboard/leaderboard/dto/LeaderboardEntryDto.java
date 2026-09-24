package com.carsleaderboard.leaderboard.dto;

import com.carsleaderboard.car.dto.CarSummaryDto;

public record LeaderboardEntryDto(long rank, CarSummaryDto car, long votes) {
}
