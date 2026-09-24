import { useEffect, useState } from 'react';

const DURATION_MS = 400;

/** Animates a number from 0 to `target` on mount/change, skipped entirely for
 *  prefers-reduced-motion. Presentational only - never invents the target value. */
export function useCountUp(target) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target == null) return;
    // requestAnimationFrame never fires for a hidden/backgrounded tab, which would otherwise
    // leave the number stuck at 0 indefinitely if the page loads before it's ever shown.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) {
      setValue(target);
      return;
    }

    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}
