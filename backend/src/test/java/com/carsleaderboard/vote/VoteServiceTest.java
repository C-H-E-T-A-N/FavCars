package com.carsleaderboard.vote;

import com.carsleaderboard.car.Car;
import com.carsleaderboard.car.CarRepository;
import com.carsleaderboard.leaderboard.LeaderboardService;
import com.carsleaderboard.vote.dto.VoteResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class VoteServiceTest {

    @Autowired
    private VoteService voteService;
    @Autowired
    private CarRepository carRepository;
    @Autowired
    private VoteRepository voteRepository;
    @Autowired
    private StringRedisTemplate redisTemplate;

    @AfterEach
    void cleanUp() {
        carRepository.deleteAll();
        voteRepository.deleteAll();
        redisTemplate.delete(LeaderboardService.LEADERBOARD_KEY);
    }

    private String saveCar() {
        Car car = new Car();
        car.setMake("BMW");
        car.setModel("M3");
        return carRepository.save(car).getId();
    }

    @Test
    void votingIncrementsMongoAndRedisAndReturnsRank1ForTheFirstVoter() {
        String carId = saveCar();

        VoteResponse response = voteService.vote("user1", carId);

        assertThat(response.success()).isTrue();
        assertThat(response.voteCount()).isEqualTo(1);
        assertThat(response.rank()).isEqualTo(1);
        assertThat(carRepository.findById(carId).orElseThrow().getVoteCount()).isEqualTo(1);
    }

    @Test
    void votingForACarThatDoesNotExistIs404() {
        assertThatThrownBy(() -> voteService.vote("user1", "does-not-exist"))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", HttpStatus.NOT_FOUND);
    }

    @Test
    void votingTwiceForTheSameCarIs409() {
        String carId = saveCar();
        voteService.vote("user1", carId);

        assertThatThrownBy(() -> voteService.vote("user1", carId))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", HttpStatus.CONFLICT);

        // the rejected second vote must not have double-counted
        assertThat(carRepository.findById(carId).orElseThrow().getVoteCount()).isEqualTo(1);
    }

    @Test
    void hasVotedReflectsPriorVotes() {
        String carId = saveCar();

        assertThat(voteService.hasVoted("user1", carId)).isFalse();
        voteService.vote("user1", carId);
        assertThat(voteService.hasVoted("user1", carId)).isTrue();
        assertThat(voteService.hasVoted(null, carId)).isFalse();
    }
}
