export default function About() {
  return (
    <div className="about-page">
      <h1>About FavCars</h1>
      <p>
        FavCars is a live, community-voted leaderboard of the world's cars. Every ranking on this
        site comes from real votes cast by signed-in users - nothing is hand-picked or staged.
      </p>
      <p>
        The catalog is sourced from <a href="https://github.com/vehiclesdb/vehiclesdb" target="_blank" rel="noreferrer">VehiclesDB</a>,
        an open vehicle database, plus a small hand-curated set of demo cars with full specifications.
      </p>
    </div>
  );
}
