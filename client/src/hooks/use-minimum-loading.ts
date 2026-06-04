import { useEffect, useRef, useState } from 'react';

export function useMinimumLoading(isLoading: boolean, minimumMs = 300) {
  const [showLoading, setShowLoading] = useState(isLoading);
  const loadingStartedAt = useRef<number | null>(isLoading ? Date.now() : null);

  useEffect(() => {
    if (isLoading) {
      loadingStartedAt.current = Date.now();
      setShowLoading(true);
      return undefined;
    }

    const startedAt = loadingStartedAt.current;
    if (!startedAt) {
      setShowLoading(false);
      return undefined;
    }

    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(minimumMs - elapsed, 0);

    const timer = window.setTimeout(() => {
      setShowLoading(false);
      loadingStartedAt.current = null;
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [isLoading, minimumMs]);

  return showLoading;
}
