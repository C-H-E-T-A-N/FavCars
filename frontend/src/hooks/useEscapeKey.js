import { useEffect } from 'react';

/** Closes a modal on Escape - shared by every modal in the app. */
export function useEscapeKey(onEscape) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onEscape();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onEscape]);
}
