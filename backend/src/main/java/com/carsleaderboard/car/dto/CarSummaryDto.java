package com.carsleaderboard.car.dto;

import com.carsleaderboard.car.Car;

public record CarSummaryDto(
        String id,
        String make,
        String model,
        Integer year,
        String country,
        String bodyType,
        Car.Image image
) {
    public static CarSummaryDto from(Car car) {
        return new CarSummaryDto(car.getId(), car.getMake(), car.getModel(), car.getYear(),
                car.getCountry(), car.getBodyType(), car.getImage());
    }
}
