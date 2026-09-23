package com.carsleaderboard.stats;

import com.carsleaderboard.car.Car;
import com.carsleaderboard.car.CarRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.group;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.unwind;

/** Real numbers for the landing page's stats row - never hand-typed marketing figures. */
@RestController
public class StatsController {

    private final CarRepository carRepository;
    private final MongoTemplate mongoTemplate;

    public StatsController(CarRepository carRepository, MongoTemplate mongoTemplate) {
        this.carRepository = carRepository;
        this.mongoTemplate = mongoTemplate;
    }

    private record VoteSum(Long total) {}
    private record CountryCount(List<String> countries) {}

    @GetMapping("/api/stats")
    public StatsResponse stats() {
        long totalCars = carRepository.count();

        Aggregation voteSumAgg = newAggregation(
                group().sum("voteCount").as("total")
        );
        AggregationResults<VoteSum> voteResult = mongoTemplate.aggregate(voteSumAgg, Car.class, VoteSum.class);
        long totalVotes = voteResult.getUniqueMappedResult() != null && voteResult.getUniqueMappedResult().total() != null
                ? voteResult.getUniqueMappedResult().total() : 0;

        Aggregation countryAgg = newAggregation(
                unwind("availability"),
                group().addToSet("availability").as("countries")
        );
        AggregationResults<CountryCount> countryResult = mongoTemplate.aggregate(countryAgg, Car.class, CountryCount.class);
        long totalCountries = countryResult.getMappedResults().isEmpty()
                ? 0 : countryResult.getMappedResults().get(0).countries().size();

        return new StatsResponse(totalCars, totalVotes, totalCountries);
    }
}
