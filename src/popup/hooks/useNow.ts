import { useEffect, useState } from 'preact/hooks';

/** Current time, re-rendering every `interval` ms so relative times stay fresh. */
export function useNow(interval = 5000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}
