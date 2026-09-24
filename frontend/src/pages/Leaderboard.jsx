import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useElapsedLabel } from '../hooks/useElapsedLabel';
import Pagination from '../components/Pagination';
import { getStats } from '../services/api';
import { ArrowRightIcon, SearchIcon } from '../components/icons';

function formatVotes(n) {
  return n.toLocaleString('en-US');
}

function formatCompact(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return String(n);
}

function CarThumb({ car }) {
  return car.image?.url ? (
    <img src={car.image.url} alt={`${car.make} ${car.model}`} />
  ) : (
    <span className="thumb-placeholder">{car.make?.[0]}{car.model?.[0]}</span>
  );
}

export default function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') || 0);
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState('');

  const { data, loading, error, lastUpdated } = useLeaderboard(page);
  const updatedLabel = useElapsedLabel(lastUpdated);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
  }, []);

  const setPage = (p) => setSearchParams({ page: String(p) });

  const submitHeroSearch = (e) => {
    e.preventDefault();
    if (heroQuery.trim()) navigate(`/explore?q=${encodeURIComponent(heroQuery.trim())}`);
  };

  const top3 = page === 0 ? data.content.slice(0, 3) : [];
  const rows = page === 0 ? data.content.slice(3) : data.content;
  const [first, second, third] = top3;

  return (
    <div className="leaderboard-page">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-eyebrow">DRIVEN BY PASSION</div>
          <h1>THE WORLD'S<br />CAR <span className="accent">LEADERBOARD</span></h1>
          <p>Vote for the cars you love. Discover legends. See what the world drives.</p>
          <form className="hero-search" onSubmit={submitHeroSearch} role="search">
            <SearchIcon className="icon" />
            <input
              type="text"
              placeholder="Search for any car (e.g. BMW M3, Toyota Supra, Ferrari 296)"
              aria-label="Search for any car"
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
            />
          </form>

          {stats && (
            <div className="hero-stats">
              <div><strong>{formatCompact(stats.totalCars)}</strong><span>Cars</span></div>
              <div><strong>{formatCompact(stats.totalVotes)}</strong><span>Votes</span></div>
              <div><strong>{stats.totalCountries}+</strong><span>Countries</span></div>
              <div><strong>1</strong><span>Global Community</span></div>
            </div>
          )}
        </div>

        <div className="hero-image">
          <img src="/images/hero-car.webp" alt="A car enthusiast admiring a BMW in an underground garage" />
          <div className="hero-image-caption">CARS BRING<br />PEOPLE TOGETHER</div>
        </div>
      </section>

      <section className="top3-section">
        <div className="section-heading">
          <div>
            <h2>Top 3 Cars</h2>
            <p>The most loved cars by the community. Updated in real-time.</p>
          </div>
          <div className="live-indicator">
            <span className="live-dot" /> LIVE RANKING
            <div className="live-updated">{updatedLabel}</div>
          </div>
        </div>

        {loading && !lastUpdated && <p className="status-message status-loading">Loading leaderboard…</p>}
        {error && <p className="status-message status-error">{error}</p>}

        {!loading && !error && top3.length === 0 && page === 0 && (
          <p className="status-message">No votes yet — be the first to vote for a car in Explore Cars.</p>
        )}

        {top3.length === 3 && (
          <div className="top3-grid">
            <Link to={`/cars/${second.car.id}`} className="top3-card rank-2">
              <div className="top3-image"><CarThumb car={second.car} /></div>
              <div className="top3-rank">2</div>
              <div className="top3-votes">{formatVotes(second.votes)}<span>votes</span></div>
              <div className="top3-name">
                <strong>{second.car.make}</strong>
                <span>{second.car.model}</span>
              </div>
            </Link>

            <Link to={`/cars/${first.car.id}`} className="top3-card rank-1">
              <div className="top3-image"><CarThumb car={first.car} /></div>
              <div className="top3-rank gold">1</div>
              <div className="top3-votes">{formatVotes(first.votes)}<span>votes</span></div>
              <div className="top3-name">
                <strong>{first.car.make}</strong>
                <span>{first.car.model}</span>
              </div>
            </Link>

            <Link to={`/cars/${third.car.id}`} className="top3-card rank-3">
              <div className="top3-image"><CarThumb car={third.car} /></div>
              <div className="top3-rank">3</div>
              <div className="top3-votes">{formatVotes(third.votes)}<span>votes</span></div>
              <div className="top3-name">
                <strong>{third.car.make}</strong>
                <span>{third.car.model}</span>
              </div>
            </Link>
          </div>
        )}
      </section>

      {rows.length > 0 && (
        <section className="leaderboard-table-section">
          <h2>Global Leaderboard</h2>
          <table className="leaderboard-table">
            <thead>
              <tr><th>#</th><th>Car</th><th>Votes</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry.car.id}>
                  <td className="rank-cell">{entry.rank}</td>
                  <td className="car-cell">
                    <span className="row-thumb"><CarThumb car={entry.car} /></span>
                    {entry.car.make} {entry.car.model}
                  </td>
                  <td className="votes-cell">{formatVotes(entry.votes)}</td>
                  <td className="view-cell">
                    <Link to={`/cars/${entry.car.id}`} aria-label={`View ${entry.car.make} ${entry.car.model}`}>
                      <ArrowRightIcon className="icon icon-sm" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
        </section>
      )}

      <section className="cta-banner">
        <div>
          <h3>Not seeing your favorite car?</h3>
          <p>Browse the full catalog and vote for any car in the collection.</p>
        </div>
        <Link to="/explore" className="cta-button">Explore Cars <ArrowRightIcon className="icon icon-sm" /></Link>
      </section>
    </div>
  );
}
