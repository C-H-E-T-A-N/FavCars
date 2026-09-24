package com.carsleaderboard.vote;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface VoteRepository extends MongoRepository<Vote, String> {
    boolean existsByUserIdAndCarId(String userId, String carId);
}
