package com.carsleaderboard.car;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CarRepository extends MongoRepository<Car, String> {

    Optional<Car> findByExternalId(String externalId);

    Page<Car> findByMakeRegexOrModelRegexOrVariantRegex(
            String makePattern, String modelPattern, String variantPattern, Pageable pageable);
}
