package com.carsleaderboard.leaderboard;

import com.carsleaderboard.car.Car;
import com.carsleaderboard.car.CarRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.data.redis.core.ZSetOperations.TypedTuple;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = LeaderboardController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class LeaderboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LeaderboardService leaderboardService;
    @MockitoBean
    private CarRepository carRepository;

    private Car car(String id, String make, String model) {
        Car car = new Car();
        car.setId(id);
        car.setMake(make);
        car.setModel(model);
        return car;
    }

    private TypedTuple<String> tuple(String carId, double score) {
        return new org.springframework.data.redis.core.DefaultTypedTuple<>(carId, score);
    }

    @Test
    void leaderboardReturnsCarsInRedisRankOrderWithOneBasedRanks() throws Exception {
        Set<TypedTuple<String>> ranked = new LinkedHashSet<>(List.of(
                tuple("car1", 300),
                tuple("car2", 200)
        ));
        when(leaderboardService.getTopRange(0, 29)).thenReturn(ranked);
        when(leaderboardService.size()).thenReturn(2L);
        when(carRepository.findAllById(List.of("car1", "car2")))
                .thenReturn(List.of(car("car1", "Porsche", "911"), car("car2", "BMW", "M3")));

        mockMvc.perform(get("/api/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].rank").value(1))
                .andExpect(jsonPath("$.content[0].car.make").value("Porsche"))
                .andExpect(jsonPath("$.content[0].votes").value(300))
                .andExpect(jsonPath("$.content[1].rank").value(2))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void leaderboardOffsetsRankByPage() throws Exception {
        Set<TypedTuple<String>> ranked = new LinkedHashSet<>(List.of(tuple("car31", 5)));
        when(leaderboardService.getTopRange(30, 59)).thenReturn(ranked);
        when(leaderboardService.size()).thenReturn(31L);
        when(carRepository.findAllById(List.of("car31"))).thenReturn(List.of(car("car31", "Fiat", "500")));

        mockMvc.perform(get("/api/leaderboard").param("page", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].rank").value(31));
    }

    @Test
    void emptyLeaderboardReturnsEmptyContent() throws Exception {
        when(leaderboardService.getTopRange(0, 29)).thenReturn(Set.of());
        when(leaderboardService.size()).thenReturn(0L);

        mockMvc.perform(get("/api/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(0));
    }
}
