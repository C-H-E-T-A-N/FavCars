package com.carsleaderboard.leaderboard;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class LeaderboardServiceTest {

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @AfterEach
    void cleanUp() {
        redisTemplate.delete(LeaderboardService.LEADERBOARD_KEY);
    }

    @Test
    void incrementVoteIsCumulative() {
        assertThat(leaderboardService.incrementVote("car1")).isEqualTo(1);
        assertThat(leaderboardService.incrementVote("car1")).isEqualTo(2);
        assertThat(leaderboardService.incrementVote("car1")).isEqualTo(3);
    }

    @Test
    void initializeIfAbsentNeverOverwritesAnExistingScore() {
        leaderboardService.incrementVote("car1");
        leaderboardService.incrementVote("car1");

        leaderboardService.initializeIfAbsent("car1", 0);

        assertThat(leaderboardService.getScore("car1")).isEqualTo(2.0);
    }

    @Test
    void initializeIfAbsentAddsCarsNotYetOnTheLeaderboard() {
        leaderboardService.initializeIfAbsent("car2", 5);

        assertThat(leaderboardService.getScore("car2")).isEqualTo(5.0);
    }

    @Test
    void rankIsZeroBasedAndDescendingByScore() {
        leaderboardService.initializeIfAbsent("low", 1);
        leaderboardService.initializeIfAbsent("mid", 5);
        leaderboardService.initializeIfAbsent("high", 10);

        assertThat(leaderboardService.getRank("high")).isEqualTo(0);
        assertThat(leaderboardService.getRank("mid")).isEqualTo(1);
        assertThat(leaderboardService.getRank("low")).isEqualTo(2);
    }

    @Test
    void unrankedCarHasNullRankAndScore() {
        assertThat(leaderboardService.getRank("never-added")).isNull();
        assertThat(leaderboardService.getScore("never-added")).isNull();
    }

    @Test
    void getTopRangeReturnsHighestScoresFirst() {
        leaderboardService.initializeIfAbsent("bronze", 10);
        leaderboardService.initializeIfAbsent("gold", 30);
        leaderboardService.initializeIfAbsent("silver", 20);

        List<String> topTwo = leaderboardService.getTopRange(0, 1).stream()
                .map(ZSetOperations.TypedTuple::getValue)
                .toList();

        assertThat(topTwo).containsExactly("gold", "silver");
        assertThat(leaderboardService.size()).isEqualTo(3);
    }
}
