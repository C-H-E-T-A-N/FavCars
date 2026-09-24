package com.carsleaderboard.importer;

import com.carsleaderboard.car.Car;
import com.carsleaderboard.car.CarRepository;
import com.carsleaderboard.leaderboard.LeaderboardService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

/**
 * Idempotent car data importer, run as:
 *   mvn spring-boot:run -Dspring-boot.run.arguments=import-cars
 *   mvn spring-boot:run -Dspring-boot.run.arguments=import-seed-cars
 *   mvn spring-boot:run -Dspring-boot.run.arguments=sync-leaderboard
 * Upserts by externalId, so running twice never creates duplicates.
 */
@Component
public class DataImportRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataImportRunner.class);

    private final CarRepository carRepository;
    private final LeaderboardService leaderboardService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.import.vehicles-file:../data/vehicles.json}")
    private String vehiclesFile;

    @Value("${app.import.seed-file:../data/seed-cars.json}")
    private String seedFile;

    public DataImportRunner(CarRepository carRepository, LeaderboardService leaderboardService) {
        this.carRepository = carRepository;
        this.leaderboardService = leaderboardService;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (args.containsOption("import-cars")) {
            importVehiclesDb();
        }
        if (args.containsOption("import-seed-cars")) {
            importSeedCars();
        }
        if (args.containsOption("sync-leaderboard")) {
            syncLeaderboard();
        }
    }

    /** Seeds Redis's leaderboard:global from every Car currently in MongoDB. Safe to re-run -
     *  ZADD NX never overwrites a score Redis already has, it only fills in cars Redis doesn't
     *  know about yet (e.g. after a fresh Redis instance or newly imported cars). */
    private void syncLeaderboard() {
        int count = 0;
        for (Car car : carRepository.findAll()) {
            leaderboardService.initializeIfAbsent(car.getId(), car.getVoteCount());
            count++;
        }
        log.info("Leaderboard sync done: {} cars added to leaderboard:global (existing scores untouched)", count);
    }

    private void importVehiclesDb() throws Exception {
        File file = new File(vehiclesFile);
        if (!file.exists()) {
            log.error("VehiclesDB file not found at {}. See data/README.md for how to download it.", file.getAbsolutePath());
            return;
        }
        VehiclesDbFile db = objectMapper.readValue(file, VehiclesDbFile.class);

        int created = 0, updated = 0, skipped = 0;
        for (VehiclesDbFile.Make make : db.makes) {
            if (make.models == null) continue;
            for (VehiclesDbFile.Model model : make.models) {
                if (!"car".equals(model.kind)) continue;

                String externalId = "car/" + make.slug + "/" + model.slug;
                Car car = carRepository.findByExternalId(externalId).orElse(null);
                boolean isNew = car == null;
                if (isNew) {
                    car = new Car();
                    car.setExternalId(externalId);
                    car.setCreatedAt(Instant.now());
                }

                car.setMake(make.name);
                car.setMakeSlug(make.slug);
                car.setModel(model.name);
                car.setModelSlug(model.slug);
                car.setBodyType(model.body_type);
                car.setAvailability(model.availability);
                car.setPopularityGlobalDecile(model.global_decile);
                car.setSource("vehiclesdb");
                car.setUpdatedAt(Instant.now());

                carRepository.save(car);
                if (isNew) created++; else updated++;
            }
        }
        log.info("VehiclesDB import done: {} created, {} updated, {} skipped (non-car kinds excluded)", created, updated, skipped);
    }

    private void importSeedCars() throws Exception {
        File file = new File(seedFile);
        if (!file.exists()) {
            log.error("Seed cars file not found at {}", file.getAbsolutePath());
            return;
        }
        List<SeedCar> seedCars = objectMapper.readValue(file,
                objectMapper.getTypeFactory().constructCollectionType(List.class, SeedCar.class));

        int created = 0, updated = 0;
        for (SeedCar s : seedCars) {
            String makeSlug = slugify(s.make);
            String modelSlug = slugify(s.model);
            String externalId = "seed/" + makeSlug + "/" + modelSlug + "-" + s.year;

            Car car = carRepository.findByExternalId(externalId).orElse(null);
            boolean isNew = car == null;
            if (isNew) {
                car = new Car();
                car.setExternalId(externalId);
                car.setCreatedAt(Instant.now());
            }

            car.setMake(s.make);
            car.setMakeSlug(makeSlug);
            car.setModel(s.model);
            car.setModelSlug(modelSlug);
            car.setYear(s.year);
            car.setVariant(s.variant);
            car.setCountry(s.country);
            car.setBodyType(s.bodyType);
            car.setFuelType(s.fuelType);
            car.setTransmission(s.transmission);
            car.setDrivetrain(s.drivetrain);
            if (s.engine != null) {
                Car.Engine engine = new Car.Engine();
                engine.setName(s.engine.name);
                engine.setDisplacementCc(s.engine.displacementCc);
                engine.setCylinders(s.engine.cylinders);
                engine.setHorsepower(s.engine.horsepower);
                car.setEngine(engine);
            }
            if (s.image != null) {
                Car.Image image = new Car.Image();
                image.setUrl(s.image.url);
                image.setSource(s.image.source);
                image.setCredit(s.image.credit);
                image.setLicense(s.image.license);
                car.setImage(image);
            }
            car.setSource("seed");
            car.setUpdatedAt(Instant.now());

            carRepository.save(car);
            if (isNew) created++; else updated++;
        }
        log.info("Seed car import done: {} created, {} updated", created, updated);
    }

    private String slugify(String value) {
        return value.toLowerCase(Locale.ROOT).trim()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }
}
