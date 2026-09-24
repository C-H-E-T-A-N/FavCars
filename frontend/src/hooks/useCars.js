import { useEffect, useState } from 'react';
import { getCars, searchCars } from '../services/api';

export function useCars(page, query) {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const request = query ? searchCars(query, page) : getCars(page);
    request
      .then(setData)
      .catch(() => setError('Could not load cars. Is the backend running?'))
      .finally(() => setLoading(false));
  }, [page, query]);

  return { data, loading, error };
}
