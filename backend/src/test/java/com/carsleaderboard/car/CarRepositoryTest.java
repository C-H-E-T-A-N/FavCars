package com.carsleaderboard.car;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.mongodb.test.autoconfigure.DataMongoTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/** Also exercises the MongoDB connection itself - every method here round-trips to Mongo. */
@DataMongoTest
@ActiveProfiles("test")
class CarRepositoryTest {

    @Autowired
    private CarRepository carRepository;

    @AfterEach
    void cleanUp() {
        carRepository.deleteAll();
    }

    private Car car(String externalId, String make, String model) {
        Car car = new Car();
        car.setExternalId(externalId);
        car.setMake(make);
        car.setMakeSlug(make.toLowerCase());
        car.setModel(model);
        car.setModelSlug(model.toLowerCase());
        car.setSource("vehiclesdb");
        return car;
    }

    @Test
    void findByExternalIdReturnsSavedCar() {
        carRepository.save(car("car/bmw/m3", "BMW", "M3"));

        Optional<Car> found = carRepository.findByExternalId("car/bmw/m3");

        assertThat(found).isPresent();
        assertThat(found.get().getModel()).isEqualTo("M3");
    }

    @Test
    void findByExternalIdReturnsEmptyWhenMissing() {
        assertThat(carRepository.findByExternalId("does/not/exist")).isEmpty();
    }

    @Test
    void paginationReturnsCorrectPageMetadata() {
        for (int i = 0; i < 5; i++) {
            carRepository.save(car("car/make/model-" + i, "Make", "Model " + i));
        }

        Page<Car> page = carRepository.findAll(PageRequest.of(0, 2));

        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getTotalElements()).isEqualTo(5);
        assertThat(page.getTotalPages()).isEqualTo(3);
    }

    @Test
    void searchIsCaseInsensitiveAcrossMakeModelAndVariant() {
        Car bmw = car("car/bmw/m3", "BMW", "M3");
        carRepository.save(bmw);
        carRepository.save(car("car/toyota/corolla", "Toyota", "Corolla"));

        Page<Car> results = carRepository
                .findByMakeRegexOrModelRegexOrVariantRegex(
                        "(?i)bmw", "(?i)bmw", "(?i)bmw", PageRequest.of(0, 10));

        assertThat(results.getContent()).extracting(Car::getMake).containsExactly("BMW");
    }
}
