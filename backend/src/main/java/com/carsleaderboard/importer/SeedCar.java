package com.carsleaderboard.importer;

/** Maps data/seed-cars.json - a small hand-curated set of cars with real specs for the demo. */
public class SeedCar {
    public String make;
    public String model;
    public Integer year;
    public String variant;
    public String country;
    public String bodyType;
    public String fuelType;
    public String transmission;
    public String drivetrain;
    public Engine engine;
    public Image image;

    public static class Engine {
        public String name;
        public Integer displacementCc;
        public Integer cylinders;
        public Integer horsepower;
    }

    public static class Image {
        public String url;
        public String source;
        public String credit;
        public String license;
    }
}
