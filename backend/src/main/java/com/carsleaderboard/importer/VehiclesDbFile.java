package com.carsleaderboard.importer;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/** Maps dist/vehicles.json from https://github.com/vehiclesdb/vehiclesdb (schema_version 2). */
@JsonIgnoreProperties(ignoreUnknown = true)
public class VehiclesDbFile {
    public String version;
    public List<Make> makes;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Make {
        public String name;
        public String slug;
        public List<Model> models;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Model {
        public String name;
        public String slug;
        public String kind;
        public String body_type;
        public Integer global_decile;
        public List<String> availability;
    }
}
