# Car Leaderboard

A car catalog with Google login, voting, and a live Redis-backed leaderboard.
See [`data/README.md`](data/README.md) for how the car data is sourced.

```
React (frontend/) → Spring Boot (backend/) → MongoDB (source of truth) + Redis (leaderboard cache)
```

## Prerequisites

- Node.js 20+
- Java 21 (JDK)
- MongoDB running locally (Community Server or Atlas)
- **Redis running locally** - see step 0 below. There's no official Redis build for Windows;
  this project uses [redis-windows (taizod1024 fork)](https://github.com/taizod1024/redis-windows-fork),
  a portable build with no installer.
- Maven (`mvn` on your PATH). The project also ships `mvnw`/`mvnw.cmd` (Maven Wrapper) if you'd
  rather not install Maven - use whichever works; on this machine `mvnw`'s self-download got
  stuck behind antivirus file-locking, so `mvn` is what's documented below
- MongoDB Compass (optional, for browsing the `cars`/`users`/`votes` collections)

## 0. Start Redis

Windows has no official Redis build. Two good options:

**Option A - portable redis-windows build (what this project uses):**
```powershell
winget install --id taizod1024.redis-windows-fork -e
# then, from wherever winget installed it:
redis-server.exe
```
Leave that window open, or run it detached:
```powershell
Start-Process redis-server.exe
```

**Option B - [Memurai](https://www.memurai.com/) Developer Edition** (a genuine Redis-compatible
Windows service) if you'd rather it run as a background service - `winget install Memurai.MemuraiDeveloper`.

Verify it's up:
```bash
redis-cli ping   # → PONG
```

Redis connection is configurable via env vars (defaults shown):
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 1. Start MongoDB

If installed as a Windows service, it's likely already running:

```powershell
Get-Service -Name MongoDB
```

Otherwise start it manually (adjust the data/log paths to yours):

```bash
mongod --dbpath /path/to/data
```

(or just try starting the backend - it will fail loudly at startup if it can't connect.)

## 2. Backend

```bash
cd backend
cp .env.example .env   # then edit .env with real values
```

Spring Boot doesn't auto-load `.env` files - export the variables into your shell (or your IDE's
run configuration) before running:

```bash
# from backend/, bash
export $(grep -v '^#' .env | xargs)
mvn spring-boot:run
```

```powershell
# from backend/, PowerShell
Get-Content .env | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
  $k, $v = $_ -split '=', 2
  Set-Item -Path "Env:$k" -Value $v
}
mvn spring-boot:run
```

The app boots fine (with car browsing/search fully working) even without real Google credentials -
`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` just need to be set to *something* for Spring Security's
OAuth2 client to initialize; "Continue with Google" will fail until you put in real values (see
step 5 below). It needs Redis reachable at `REDIS_HOST:REDIS_PORT` to start at all, though.

Backend runs on `http://localhost:8080`.

## 3. Import car data and initialize the leaderboard

See [`data/README.md`](data/README.md) for where `vehicles.json` comes from. With it downloaded
into `data/`, MongoDB + Redis running, and the env vars above ready:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.arguments=import-cars        # ~5,000 cars from VehiclesDB
mvn spring-boot:run -Dspring-boot.run.arguments=import-seed-cars   # ~24 hand-specced demo cars
mvn spring-boot:run -Dspring-boot.run.arguments=sync-leaderboard   # seeds Redis from Mongo vote counts
```

(These can be combined in one run: `-Dspring-boot.run.arguments="import-cars import-seed-cars sync-leaderboard"`.)

All three are idempotent - safe to re-run any time. `sync-leaderboard` in particular uses
`ZADD NX`, so it only *adds* cars Redis doesn't know about yet; it never resets a vote count
that's already there. Run it any time Redis's leaderboard needs to be rebuilt from Mongo (e.g.
after wiping Redis, or after importing new cars).

**If `mvn spring-boot:run -Dspring-boot.run.arguments=...` hangs** (starts, serves requests, but
the import never progresses - saw this intermittently on this machine, unrelated to MongoDB/Redis
health), build once and run the jar directly instead, which doesn't go through Maven's forked
process:
```bash
mvn -q clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar --import-cars --import-seed-cars --sync-leaderboard
```

Each of these starts the full app and keeps the web server running afterwards - stop it with
Ctrl+C once the "done" log line appears.

## 4. Redis key design

```
leaderboard:global   Sorted Set
  member = car id (Mongo ObjectId as string)
  score  = total vote count
```

That's the only Redis key this phase uses. Inspect it directly:

```bash
redis-cli
> ZCARD leaderboard:global                      # how many cars are ranked
> ZREVRANGE leaderboard:global 0 29 WITHSCORES   # top 30, highest votes first
> ZREVRANK leaderboard:global <carId>            # a car's 0-based rank
> ZSCORE leaderboard:global <carId>              # a car's vote count
```

Everything under `POST /api/cars/{id}/vote` and `GET /api/leaderboard` is built purely from these
four command types (see `LeaderboardService`) - nothing sorts the `cars` collection in Mongo to
produce a ranking.

## 5. Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create a project (or pick an existing one).
2. **APIs & Services → OAuth consent screen**: choose **External**, fill in an app name and your
   email, and add your Google account as a test user (while the app is unpublished).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:8080/login/oauth2/code/google`
     (this is Spring Security's default OAuth2 callback path - `{baseUrl}/login/oauth2/code/{registrationId}`)
4. Copy the generated **Client ID** and **Client Secret** into `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxxxxxx
   ```
5. Restart the backend (env vars are only read at startup).
6. Test: open `http://localhost:5173`, click **Continue with Google**, sign in. You should land
   back on the app with your name and avatar showing in the navbar.

Only `localhost` URLs are configured here - this is local-dev only, nothing is deployed.

## 6. Frontend

```bash
cd frontend
cp .env.example .env   # defaults already point at http://localhost:8080
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Running the whole thing

1. Redis running (`redis-cli ping` → `PONG`)
2. MongoDB running
3. `cd backend && mvn spring-boot:run` (leave running)
4. `cd frontend && npm run dev` (leave running)
5. Open `http://localhost:5173`

You should be able to: see the live leaderboard (Top 3 + ranked table, polling every ~7s), search,
paginate, click into a car's details, see its rank/vote count, log in with Google, vote for a car,
get blocked from voting twice, see the vote count and rank update live, and browse the full catalog
under Explore Cars.

## Testing voting end-to-end

1. Sign in with Google.
2. Open any car's details page (`/cars/{id}`) - the button reads **❤️ VOTE FOR THIS CAR**.
3. Click it. The button becomes **✓ VOTED** (disabled), and the votes/rank numbers update
   immediately from the backend's response - no page reload.
4. Refresh the page: the button is still **✓ VOTED** (from `GET /api/cars/{id}/vote-status`),
   and the rank/votes are still correct (from Redis via `GET /api/cars/{id}/ranking`).
5. Try voting for the same car again (e.g. via a second tab, or curling the endpoint): you get
   `409 Conflict` with `{"success": false, "message": "You have already voted for this car."}`.
6. Verify in Redis directly:
   ```bash
   redis-cli ZREVRANGE leaderboard:global 0 -1 WITHSCORES
   ```
7. Verify in Mongo that `votes` and `cars.voteCount` agree:
   ```bash
   mongosh car_leaderboard --eval "db.votes.countDocuments({carId: '<id>'})"
   mongosh car_leaderboard --eval "db.cars.findOne({_id: ObjectId('<id>')}, {voteCount: 1})"
   ```

## Tests

```bash
cd backend && mvn test    # repository, controller, vote, and leaderboard tests (needs MongoDB + Redis running)
cd frontend && npm test   # component/page tests (mocked API, no backend needed)
```

## API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/cars?page=0&size=30` | - | Paginated car list |
| GET | `/api/cars/{id}` | - | Full car details |
| GET | `/api/cars/search?q=bmw&page=0&size=30` | - | Case-insensitive search across make/model/variant |
| GET | `/api/leaderboard?page=0&size=30` | - | Ranked page, built from Redis (`{ content: [{rank, car, votes}], page, size, totalElements, totalPages }`) |
| GET | `/api/stats` | - | Real, computed numbers for the landing page's stats row: `{ totalCars, totalVotes, totalCountries }` - never hand-typed |
| GET | `/api/cars/{id}/ranking` | - | `{ carId, rank, votes }` for one car, via `ZREVRANK`/`ZSCORE` |
| GET | `/api/cars/{id}/vote-status` | - | `{ hasVoted }` for the current session (always `false` if logged out) |
| POST | `/api/cars/{id}/vote` | required | Cast one vote. `401` if not signed in, `404` if the car doesn't exist, `409` if already voted |
| GET | `/api/auth/me` | - | Current session: `{ authenticated, user }` |
| GET | `/oauth2/authorization/google` | - | Starts the Google login redirect (Spring Security route) |
| POST | `/api/auth/logout` | - | Clears the session |

## Request flow (voting)

```
React (VoteButton)
  │  POST /api/cars/{id}/vote
  ▼
Spring Boot (VoteController)
  │  resolve current user from session
  ▼
VoteService
  ├─ CarRepository.existsById()        → 404 if missing
  ├─ VoteRepository.save(Vote)         → 409 if duplicate (unique index on userId+carId)
  ├─ MongoTemplate.updateFirst($inc)   → atomically bump Car.voteCount
  └─ LeaderboardService.incrementVote  → ZINCRBY leaderboard:global 1 carId
  ▼
Response: { success, carId, voteCount, rank }
  ▼
React updates votes/rank in place - no refetch, no reload
```

```
React (Leaderboard page, polling every 7s while tab is visible)
  │  GET /api/leaderboard?page=0&size=30
  ▼
LeaderboardController
  ├─ LeaderboardService.getTopRange()  → ZREVRANGE leaderboard:global start end WITHSCORES
  └─ CarRepository.findAllById(ids)    → hydrate make/model/image for exactly those cars
  ▼
Response: ranked page → React renders Top 3 + table
```

## Redis learning notes

**Why a Sorted Set, not MongoDB sorting?** A Sorted Set keeps every member ordered by score at
all times, as an update-time cost - insert/update is `O(log N)`. Getting "top 30" or "this car's
rank" is then just a range/rank lookup, also `O(log N)`. Doing the equivalent in Mongo means either
sorting the whole `cars` collection on every leaderboard request (`O(N log N)`, repeated per
request, against 5,000+ documents) or maintaining a separate rank field yourself with no atomic
primitive to keep it consistent under concurrent writes. Redis gives you that primitive for free.

**What does `ZINCRBY` do?** Atomically adds a delta to a member's score (creating the member with
that score if it doesn't exist yet) and returns the new score, in one round trip. It's a single
Redis command, so it can't be interrupted partway.

**How does `ZREVRANGE` retrieve the top 30?** The sorted set is stored as a skip list ordered by
score. `ZREVRANGE key 0 29` walks that structure from the highest score for 30 elements - it never
touches the other 5,000+ members.

**How does `ZREVRANK` calculate a car's ranking?** Same skip list, but instead of returning a
range of members it counts how many members have a strictly higher score than the given member,
which is exactly its 0-based descending rank.

**What happens when two users vote simultaneously?** Redis is single-threaded for command
execution, so two concurrent `ZINCRBY leaderboard:global 1 carId` calls are simply queued and
run one after another - both increments land, nothing is lost. This is the whole reason to use
`ZINCRBY` instead of a read-modify-write.

**Why is `ZINCRBY` safer than `GET` + `SET`?** `GET` + increment-in-app-code + `SET` is three
separate steps with a gap in between. If two requests both `GET` the same starting value before
either `SET`s, one increment silently overwrites the other (a lost update / race condition).
`ZINCRBY` does the read-modify-write atomically inside Redis, so there's no gap for another
request to land in.

**What happens if Redis goes down?** Right now: voting and the leaderboard endpoints fail (Redis
is a hard dependency for those paths), but the rest of the app - browsing, search, car details -
keeps working since those only touch Mongo. `Car.voteCount` in Mongo is never lost (it's updated
independently in the same vote transaction path, before the Redis call), so once Redis is back up,
`sync-leaderboard` rebuilds `leaderboard:global` from it exactly.

**How can MongoDB and Redis become inconsistent?** The vote flow writes to Mongo (the `votes` row,
then `Car.voteCount`) *before* it writes to Redis (`ZINCRBY`). If the process crashes or Redis is
unreachable in that narrow window after the Mongo writes commit but before the Redis call
completes, Mongo's `voteCount` is ahead of Redis's score for that car - the vote is durably
recorded (the user can't vote again, and `Car.voteCount` reflects it) but the leaderboard rank is
briefly stale until `sync-leaderboard` is run again. This project doesn't use distributed
transactions or a message queue to close that gap - it's a deliberate simplification for this
phase (see `VoteService.vote`), acceptable because Mongo is defined as the source of truth and the
inconsistency window is small, rare, and self-healing via a re-run of `sync-leaderboard`.

## Project structure

```
car-leaderboard/
├── frontend/   React + Vite + React Router + Axios
├── backend/    Spring Boot + Spring Data MongoDB + Spring Data Redis + Spring Security (OAuth2/Google)
├── data/       Importer inputs - see data/README.md
└── README.md
```

## MongoDB changes this phase

- `cars.voteCount` (long, default 0) - mirrors the Redis score; MongoDB stays the source of truth.
- New `votes` collection: `{ _id, userId, carId, createdAt }`, with a **unique compound index on
  `(userId, carId)`** - that index, not application code, is what actually guarantees one vote per
  user per car (`VoteService` just translates the resulting `DuplicateKeyException` into a 409).

## What's deliberately not here yet

Country/category leaderboards, Redis Pub/Sub, Redis Streams, BullMQ, WebSockets, distributed
locks, Redis Cluster, car request/submission, admin dashboard/approval, user-uploaded images,
notifications, microservices, Docker/Kubernetes, production deployment. Those are future
learning phases once this foundation (leaderboard + voting, backed by Mongo + Redis) is solid.
