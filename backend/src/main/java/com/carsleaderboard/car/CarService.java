package com.carsleaderboard.car;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;


@Service
public class CarService {

    private final CarRepository carRepository;

    public CarService(CarRepository carRepository) {
        this.carRepository = carRepository;
    }

    public Page<Car> getCars(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("make").ascending().and(Sort.by("model").ascending()));
        return carRepository.findAll(pageable);
    }

    public Car getCarById(String id) {
        return carRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found: " + id));
    }

    public Page<Car> search(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("make").ascending().and(Sort.by("model").ascending()));
        // "(?i)" is Mongo's PCRE case-insensitive inline flag - the RegexIgnoreCase derived-query
        // keyword silently ignores IgnoreCase and searches case-sensitively, so we set it ourselves.
        String pattern = "(?i)" + escapeRegex(query.trim());
        return carRepository.findByMakeRegexOrModelRegexOrVariantRegex(pattern, pattern, pattern, pageable);
    }

    /** Escapes PCRE metacharacters so the query is matched as a literal substring, Mongo-safe
     *  (unlike java.util.regex.Pattern.quote, whose \Q...\E wrapper Mongo's regex engine doesn't understand). */
    private String escapeRegex(String value) {
        return value.replaceAll("[.*+?^${}()|\\[\\]\\\\]", "\\\\$0");
    }
}
