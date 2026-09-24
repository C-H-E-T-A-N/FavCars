import { useEffect, useState } from 'react';
import { getLeaderboard } from '../services/api';

const POLL_INTERVAL_MS = 7000;

/** Polls GET /api/leaderboard while the tab is visible, pausing when it's hidden. */
export function useLeaderboard(page) {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
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
          if (!cancelled) setLoading(false);
        });
    };

    // Initial load always runs; only the recurring poll skips hidden tabs.
    load();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') load();
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
