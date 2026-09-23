package com.carsleaderboard.vote;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.mongodb.test.autoconfigure.DataMongoTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Proves the unique (userId, carId) index - not application code - is what stops a double vote. */
@DataMongoTest
@ActiveProfiles("test")
class VoteRepositoryTest {

    @Autowired
    private VoteRepository voteRepository;

    @AfterEach
    void cleanUp() {
        voteRepository.deleteAll();
    }

    @Test
    void sameUserVotingForSameCarTwiceViolatesTheUniqueIndex() {
        voteRepository.save(new Vote("user1", "car1"));

        assertThatThrownBy(() -> voteRepository.save(new Vote("user1", "car1")))
                .isInstanceOf(DuplicateKeyException.class);
    }

    @Test
    void sameUserCanVoteForDifferentCars() {
        voteRepository.save(new Vote("user1", "car1"));
        voteRepository.save(new Vote("user1", "car2"));

        assertThat(voteRepository.existsByUserIdAndCarId("user1", "car1")).isTrue();
        assertThat(voteRepository.existsByUserIdAndCarId("user1", "car2")).isTrue();
    }

    @Test
    void differentUsersCanVoteForTheSameCar() {
        voteRepository.save(new Vote("user1", "car1"));
        voteRepository.save(new Vote("user2", "car1"));

        assertThat(voteRepository.existsByUserIdAndCarId("user1", "car1")).isTrue();
        assertThat(voteRepository.existsByUserIdAndCarId("user2", "car1")).isTrue();
    }

    @Test
    void existsByUserIdAndCarIdIsFalseWhenNoVoteExists() {
        assertThat(voteRepository.existsByUserIdAndCarId("nobody", "car1")).isFalse();
    }
}
