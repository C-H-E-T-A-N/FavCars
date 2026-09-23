package com.carsleaderboard.stats;

import com.carsleaderboard.car.Car;
import com.carsleaderboard.car.CarRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Real numbers only - this hits the actual aggregation against Mongo, not a mock. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StatsControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private CarRepository carRepository;

    @AfterEach
    void cleanUp() {
        carRepository.deleteAll();
    }

    private Car car(String make, long voteCount, List<String> availability) {
        Car car = new Car();
        car.setExternalId("car/" + make.toLowerCase() + "/test");
        car.setMake(make);
        car.setModel("Test");
        car.setVoteCount(voteCount);
        car.setAvailability(availability);
        return car;
    }

    @Test
    void statsReflectRealCarsVotesAndCountries() throws Exception {
        carRepository.save(car("BMW", 10, List.of("de", "nl")));
        carRepository.save(car("Toyota", 5, List.of("jp", "nl")));

        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCars").value(2))
                .andExpect(jsonPath("$.totalVotes").value(15))
                .andExpect(jsonPath("$.totalCountries").value(3));
    }

    @Test
    void statsAreZeroWithNoCars() throws Exception {
        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCars").value(0))
                .andExpect(jsonPath("$.totalVotes").value(0))
                .andExpect(jsonPath("$.totalCountries").value(0));
    }
}
