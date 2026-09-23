import { useEffect, useState } from 'react';

/** "Updated moments ago" / "Updated 12 seconds ago" text that ticks once a second. */
export function useElapsedLabel(timestamp) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timestamp) return 'Updating…';
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 3) return 'Updated moments ago';
  return `Updated ${seconds} seconds ago`;
}
