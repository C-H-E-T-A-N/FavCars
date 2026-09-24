package com.carsleaderboard.carrequest;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/** A user's "+ Request a Car" submission, reviewed by the admin dashboard before becoming a real Car. */
@Document("carRequests")
public class CarRequest {

    @Id
    private String id;

    private String make;
    private String model;
    private Integer year;
    private String note;

    private String requestedByEmail;
    private String requestedByName;

    /** PENDING, APPROVED, or REJECTED. */
    private String status = "PENDING";

    private Instant createdAt;
    private Instant reviewedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getMake() { return make; }
    public void setMake(String make) { this.make = make; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getRequestedByEmail() { return requestedByEmail; }
    public void setRequestedByEmail(String requestedByEmail) { this.requestedByEmail = requestedByEmail; }
    public String getRequestedByName() { return requestedByName; }
    public void setRequestedByName(String requestedByName) { this.requestedByName = requestedByName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }
}
