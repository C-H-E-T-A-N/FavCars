import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCars } from '../hooks/useCars';
import CarCard from '../components/CarCard';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';

export default function Landing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') || 0);
  const query = searchParams.get('q') || '';

  const { data, loading, error } = useCars(page, query);

  const setPage = (p) => setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    next.set('page', String(p));
    return next;
  });

  const setQuery = (q) => setSearchParams(q ? { q, page: '0' } : { page: '0' });

  return (
    <div className="landing">
      <SearchBar initialValue={query} onSearch={setQuery} />

      {loading && <p className="status-message">Loading cars…</p>}
      {error && <p className="status-message status-error">{error}</p>}

      {!loading && !error && data.content.length === 0 && (
        <p className="status-message">No cars found.</p>
      )}

      <div className="car-grid">
        {data.content.map((car) => <CarCard key={car.id} car={car} />)}
      </div>

      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
    </div>
  );
}
