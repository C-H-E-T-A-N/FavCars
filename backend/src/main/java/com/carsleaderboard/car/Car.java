package com.carsleaderboard.car;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/**
 * Car document. Fields not provided by a source (VehiclesDB has no year/engine/transmission/
 * image data at all) are left null rather than fabricated - see data/README.md.
 */
@Document("cars")
public class Car {

    @Id
    private String id;

    @Indexed(unique = true)
    private String externalId;

    private String make;
    private String makeSlug;
    private String model;
    private String modelSlug;

    private Integer year;
    private String variant;
    private String country;

    private String bodyType;
    private String fuelType;
    private String transmission;
    private String drivetrain;

    private Engine engine;
    private Image image;

    /** ISO-3166 alpha-2 country codes where the model is evidenced (VehiclesDB availability). */
    private List<String> availability;
    private Integer popularityGlobalDecile;

    /** Mirrors the Redis leaderboard score - MongoDB stays the source of truth, Redis is the fast
     *  ranking cache. Updated atomically alongside the Redis ZINCRBY on every vote. */
    private long voteCount = 0;

    /** "vehiclesdb" or "seed" */
    private String source;

    private Instant createdAt;
    private Instant updatedAt;

    public static class Engine {
        private String name;
        private Integer displacementCc;
        private Integer cylinders;
        private Integer horsepower;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public Integer getDisplacementCc() { return displacementCc; }
        public void setDisplacementCc(Integer displacementCc) { this.displacementCc = displacementCc; }
        public Integer getCylinders() { return cylinders; }
        public void setCylinders(Integer cylinders) { this.cylinders = cylinders; }
        public Integer getHorsepower() { return horsepower; }
        public void setHorsepower(Integer horsepower) { this.horsepower = horsepower; }
    }

    public static class Image {
        private String url;
        private String source;
        private String credit;
        private String license;

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }
        public String getCredit() { return credit; }
        public void setCredit(String credit) { this.credit = credit; }
        public String getLicense() { return license; }
        public void setLicense(String license) { this.license = license; }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
    public String getMake() { return make; }
    public void setMake(String make) { this.make = make; }
    public String getMakeSlug() { return makeSlug; }
    public void setMakeSlug(String makeSlug) { this.makeSlug = makeSlug; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getModelSlug() { return modelSlug; }
    public void setModelSlug(String modelSlug) { this.modelSlug = modelSlug; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getVariant() { return variant; }
    public void setVariant(String variant) { this.variant = variant; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getBodyType() { return bodyType; }
    public void setBodyType(String bodyType) { this.bodyType = bodyType; }
    public String getFuelType() { return fuelType; }
    public void setFuelType(String fuelType) { this.fuelType = fuelType; }
    public String getTransmission() { return transmission; }
    public void setTransmission(String transmission) { this.transmission = transmission; }
    public String getDrivetrain() { return drivetrain; }
    public void setDrivetrain(String drivetrain) { this.drivetrain = drivetrain; }
    public Engine getEngine() { return engine; }
    public void setEngine(Engine engine) { this.engine = engine; }
    public Image getImage() { return image; }
    public void setImage(Image image) { this.image = image; }
    public List<String> getAvailability() { return availability; }
    public void setAvailability(List<String> availability) { this.availability = availability; }
    public Integer getPopularityGlobalDecile() { return popularityGlobalDecile; }
    public void setPopularityGlobalDecile(Integer popularityGlobalDecile) { this.popularityGlobalDecile = popularityGlobalDecile; }
    public long getVoteCount() { return voteCount; }
    public void setVoteCount(long voteCount) { this.voteCount = voteCount; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
