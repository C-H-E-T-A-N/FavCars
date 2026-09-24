package com.carsleaderboard.vote.dto;

public record VoteResponse(boolean success, String carId, long voteCount, long rank) {
}
