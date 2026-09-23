package com.carsleaderboard.leaderboard.dto;

public record RankingResponse(String carId, Long rank, long votes) {
}
