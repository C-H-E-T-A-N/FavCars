import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCar, getRanking } from '../services/api';
import VoteButton from '../components/VoteButton';

const SPEC_ROWS = [
  ['Make', (c) => c.make],
  ['Model', (c) => c.model],
  ['Year', (c) => c.year],
  ['Variant', (c) => c.variant],
  ['Country', (c) => c.country],
  ['Body Type', (c) => c.bodyType],
  ['Fuel', (c) => c.fuelType],
  ['Transmission', (c) => c.transmission],
  ['Drivetrain', (c) => c.drivetrain],
];

const ENGINE_ROWS = [
  ['Engine', (e) => e.name],
  ['Displacement', (e) => (e.displacementCc ? `${e.displacementCc} cc` : null)],
  ['Cylinders', (e) => e.cylinders],
  ['Horsepower', (e) => (e.horsepower ? `${e.horsepower} hp` : null)],
];

export default function CarDetails() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCar(null);
    setRanking(null);
    setError(null);
    getCar(id).then(setCar).catch(() => setError('Car not found.'));
    getRanking(id).then(setRanking).catch(() => {});
  }, [id]);

  if (error) return <p className="status-message status-error">{error}</p>;
  if (!car) return <p className="status-message status-loading">Loading…</p>;

  return (
    <div className="car-details">
      <Link to="/" className="back-link">← Back to leaderboard</Link>

      {ranking?.rank && <div className="car-details-rank-badge">#{ranking.rank} GLOBAL RANK</div>}

      <h1>{car.make}<br /><span className="accent">{car.model}{car.variant ? ` ${car.variant}` : ''}</span></h1>

      <div className="car-details-image">
        {car.image?.url ? (
          <img src={car.image.url} alt={`${car.make} ${car.model}`} />
        ) : (
          <span className="car-card-placeholder">Car image unavailable</span>
        )}
      </div>

      <div className="car-details-stats">
        <div>
          <span className="stat-label">GLOBAL RANK</span>
          <span className="stat-value">{ranking?.rank ? `#${ranking.rank}` : '—'}</span>
        </div>
        <div>
          <span className="stat-label">VOTES</span>
          <span className="stat-value">{(ranking?.votes ?? 0).toLocaleString('en-US')}</span>
        </div>
      </div>

      <VoteButton carId={id} onVoted={({ voteCount, rank }) => setRanking({ carId: id, votes: voteCount, rank })} />

      <h2 className="specs-heading">Specifications</h2>
      <table className="spec-table">
        <tbody>
          {SPEC_ROWS.filter(([, get]) => get(car) != null).map(([label, get]) => (
            <tr key={label}><th>{label}</th><td>{get(car)}</td></tr>
          ))}
        </tbody>
      </table>

      {car.engine && ENGINE_ROWS.some(([, get]) => get(car.engine) != null) && (
        <>
          <h2 className="specs-heading">Engine</h2>
          <table className="spec-table">
            <tbody>
              {ENGINE_ROWS.filter(([, get]) => get(car.engine) != null).map(([label, get]) => (
                <tr key={label}><th>{label}</th><td>{get(car.engine)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
