# Data

Two source files feed the `cars` collection. Neither is committed (see `.gitignore`) -
regenerate them locally before running the importer.

## 1. `vehicles.json` - VehiclesDB catalog

The primary dataset: https://github.com/vehiclesdb/vehiclesdb (CC-BY 4.0). It contains
**identity only** - make, model, kind, body type, availability/popularity by country.
It has no year, engine, transmission, horsepower, drivetrain, or image data for any
vehicle (those fields are reserved for VehiclesDB's future paid API), so cars imported
from it leave those fields `null`.

Download the latest release:

```bash
curl -sL -o vehicles.json https://cdn.jsdelivr.net/gh/vehiclesdb/vehiclesdb@latest/dist/vehicles.json
```

## 2. `seed-cars.json` - hand-curated demo cars

A small set (~24) of well-known cars with real year/engine/spec data, hand-written
because VehiclesDB doesn't carry those fields. Already committed to this repo. These
import as separate documents (`source: "seed"`) alongside the VehiclesDB identity
records, so the same nameplate (e.g. BMW M3) can appear both as a bare VehiclesDB
entry and as a fully-specced seed entry.

## Running the importer

From `backend/`, with MongoDB running and `vehicles.json` downloaded into `data/`:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments=import-cars
mvn spring-boot:run -Dspring-boot.run.arguments=import-seed-cars
mvn spring-boot:run -Dspring-boot.run.arguments=sync-leaderboard
```

The first two are idempotent - upserted by a stable `externalId` (`car/<make>/<model>` for
VehiclesDB records, `seed/<make>/<model>-<year>` for seed records), so running them
again just refreshes the existing documents instead of duplicating them.

`sync-leaderboard` seeds Redis's `leaderboard:global` sorted set from every car's
`voteCount` in Mongo (needed after the first import, or any time Redis's data is lost -
see the root [README](../README.md#4-redis-key-design)). It uses `ZADD NX`, so re-running
it never resets a vote count Redis already has - it only adds cars Redis doesn't know
about yet.

### Car images

The three top-ranked demo cars (BMW M3, Porsche 911, Ferrari 296 GTB) have real
AI-generated photos (ChatGPT/GPT Image, background removed to a transparent cutout - just
the car, no scenery) in `data/images/` and mirrored into `frontend/public/images/` for the
dev server to serve. Every other car (the ~5,455 bare VehiclesDB entries) has no image;
the frontend shows a placeholder for those instead of fabricating one.

`frontend/public/images/hero-car.webp` is a separate hero illustration used on the
landing page - user-supplied, not one of the per-car photos.
