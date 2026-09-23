package com.carsleaderboard.vote;

import com.carsleaderboard.car.Car;
import com.carsleaderboard.car.CarRepository;
import com.carsleaderboard.leaderboard.LeaderboardService;
import com.carsleaderboard.vote.dto.VoteResponse;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Service
public class VoteService {

    private final CarRepository carRepository;
    private final VoteRepository voteRepository;
    private final MongoTemplate mongoTemplate;
    private final LeaderboardService leaderboardService;

    public VoteService(CarRepository carRepository, VoteRepository voteRepository,
                        MongoTemplate mongoTemplate, LeaderboardService leaderboardService) {
        this.carRepository = carRepository;
        this.voteRepository = voteRepository;
        this.mongoTemplate = mongoTemplate;
        this.leaderboardService = leaderboardService;
    }

    /**
     * Flow: verify car exists -> insert the vote row (the unique index is what actually blocks a
     * repeat vote, caught here as DuplicateKeyException) -> atomically $inc Car.voteCount in Mongo
     * -> ZINCRBY the Redis leaderboard. See README "Data consistency" for what happens if a step
     * after the vote-row insert fails.
     */
    public VoteResponse vote(String userId, String carId) {
        if (!carRepository.existsById(carId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found: " + carId);
        }

        try {
            voteRepository.save(new Vote(userId, carId));
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already voted for this car.");
        }

        mongoTemplate.updateFirst(query(where("id").is(carId)), new Update().inc("voteCount", 1), Car.class);

        long voteCount = leaderboardService.incrementVote(carId);
        Long zeroBasedRank = leaderboardService.getRank(carId);
        long rank = (zeroBasedRank != null ? zeroBasedRank : 0) + 1;

        return new VoteResponse(true, carId, voteCount, rank);
    }

    public boolean hasVoted(String userId, String carId) {
        return userId != null && voteRepository.existsByUserIdAndCarId(userId, carId);
    }
}
