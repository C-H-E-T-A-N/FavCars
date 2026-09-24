package com.carsleaderboard.vote;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/** One row per (user, car) vote. The unique compound index is what actually enforces
 *  "one user can vote for a car once" - see VoteService for how the DuplicateKeyException
 *  it throws on a repeat vote becomes a 409 response. */
@Document("votes")
@CompoundIndex(name = "user_car_unique", def = "{'userId': 1, 'carId': 1}", unique = true)
public class Vote {

    @Id
    private String id;

    private String userId;
    private String carId;
    private Instant createdAt;

    public Vote() {}

    public Vote(String userId, String carId) {
        this.userId = userId;
        this.carId = carId;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getCarId() { return carId; }
    public void setCarId(String carId) { this.carId = carId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
