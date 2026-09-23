import { useEffect, useRef, useState } from 'react';
import { getLeaderboard } from '../services/api';

const POLL_INTERVAL_MS = 7000;

/** Polls GET /api/leaderboard while the tab is visible, pausing when it's hidden. */
export function useLeaderboard(page) {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchedOnce.current = false;

    const load = () => {
      if (document.visibilityState !== 'visible') return;
      getLeaderboard(page)
        .then((res) => {
          if (cancelled) return;
          setData(res);
          setLastUpdated(Date.now());
          setError(null);
        })
        .catch(() => {
          if (!cancelled) setError('Could not load the leaderboard. Is the backend running?');
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
            fetchedOnce.current = true;
          }
        });
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && fetchedOnce.current) load();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [page]);

  return { data, loading, error, lastUpdated };
}
