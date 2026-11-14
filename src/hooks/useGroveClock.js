import { useEffect, useState } from 'react';

/** The current time, refreshed every minute (morning turns into day, evening into night). */
export function useGroveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
