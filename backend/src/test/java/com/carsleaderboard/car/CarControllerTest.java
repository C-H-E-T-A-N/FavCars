package com.carsleaderboard.car;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = CarController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class CarControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CarService carService;

    private Car sampleCar() {
        Car car = new Car();
        car.setId("1");
        car.setMake("BMW");
        car.setModel("M3");
        car.setYear(2026);
        car.setCountry("Germany");
        return car;
    }

    @Test
    void getCarsReturnsPagedContent() throws Exception {
        Page<Car> page = new PageImpl<>(List.of(sampleCar()), PageRequest.of(0, 30), 1);
        when(carService.getCars(eq(0), eq(30))).thenReturn(page);

        mockMvc.perform(get("/api/cars"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].make").value("BMW"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.page").value(0));
    }

    @Test
    void getCarByIdReturnsCar() throws Exception {
        when(carService.getCarById("1")).thenReturn(sampleCar());

        mockMvc.perform(get("/api/cars/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.model").value("M3"));
    }

    @Test
    void getCarByIdReturns404WhenMissing() throws Exception {
        when(carService.getCarById("missing"))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found: missing"));

        mockMvc.perform(get("/api/cars/missing"))
                .andExpect(status().isNotFound());
    }

    @Test
    void searchRequiresNonBlankQuery() throws Exception {
        mockMvc.perform(get("/api/cars/search").param("q", ""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void searchReturnsMatches() throws Exception {
        Page<Car> page = new PageImpl<>(List.of(sampleCar()), PageRequest.of(0, 30), 1);
        when(carService.search(eq("bmw"), anyInt(), anyInt())).thenReturn(page);

        mockMvc.perform(get("/api/cars/search").param("q", "bmw"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].make").value("BMW"));
    }
}
