package com.carsleaderboard.leaderboard;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.util.Set;

/**
 * All ranking reads/writes go through this one Redis Sorted Set - see README "Redis key design"
 * for the full explanation of why Sorted Sets and what each command does.
 *
 * Key: leaderboard:global
 *   Sorted Set - member = MongoDB car id (String), score = total vote count (double, integral)
 *
 * MongoDB stays the source of truth (Car.voteCount, the votes collection); this key is a fast,
 * rebuildable cache purely for ranking. If it's ever lost, {@link #initializeIfAbsent} from
 * Mongo's Car.voteCount rebuilds it exactly (see DataImportRunner's "sync-leaderboard" arg).
 */
@Service
public class LeaderboardService {

    public static final String LEADERBOARD_KEY = "leaderboard:global";

    private final ZSetOperations<String, String> zSet;

    public LeaderboardService(StringRedisTemplate redisTemplate) {
        this.zSet = redisTemplate.opsForZSet();
    }

    /** ZINCRBY leaderboard:global 1 carId - atomic, so concurrent votes never lose an increment. */
    public long incrementVote(String carId) {
        Double newScore = zSet.incrementScore(LEADERBOARD_KEY, carId, 1);
        return newScore.longValue();
    }

    /** ZADD leaderboard:global NX <voteCount> carId - only sets the score if the member is absent,
     *  so re-running the sync never resets votes already tracked in Redis. */
    public void initializeIfAbsent(String carId, long voteCount) {
        zSet.addIfAbsent(LEADERBOARD_KEY, carId, voteCount);
    }

    /** ZREVRANK leaderboard:global carId - 0-based rank by descending score, or null if unranked. */
    public Long getRank(String carId) {
        return zSet.reverseRank(LEADERBOARD_KEY, carId);
    }

    /** ZSCORE leaderboard:global carId - null if the car has never been added to the leaderboard. */
    public Double getScore(String carId) {
        return zSet.score(LEADERBOARD_KEY, carId);
    }

    /** ZREVRANGE leaderboard:global start end WITHSCORES - a page of the leaderboard, highest first. */
    public Set<ZSetOperations.TypedTuple<String>> getTopRange(long start, long end) {
        return zSet.reverseRangeWithScores(LEADERBOARD_KEY, start, end);
    }

    /** ZCARD leaderboard:global - total ranked cars, used for pagination totals. */
    public long size() {
        Long card = zSet.zCard(LEADERBOARD_KEY);
        return card != null ? card : 0;
    }

    /** ZADD leaderboard:global <voteCount> carId - overwrites the score, for admin edits to a car's vote count. */
    public void setScore(String carId, long voteCount) {
        zSet.add(LEADERBOARD_KEY, carId, voteCount);
    }

    /** ZREM leaderboard:global carId - drops the car from ranking, for admin deletes. */
    public void remove(String carId) {
        zSet.remove(LEADERBOARD_KEY, carId);
    }
}
