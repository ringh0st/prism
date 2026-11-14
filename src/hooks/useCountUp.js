import { useEffect, useState } from 'react';

const prefersCalm = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A number that counts up from 0 to `value` after `delay` ms (about 0.8 s), calling `onTick` as it climbs,
 * so a reward visibly pours in. Shows the final number at once for reduced motion.
 */
export function useCountUp(value, { delay = 0, duration = 800, onTick } = {}) {
  const [shown, setShown] = useState(() => (prefersCalm() ? value : 0));
  useEffect(() => {
    if (prefersCalm() || value <= 0) {
      setShown(value);
      return undefined;
    }
    setShown(0);
    const steps = Math.min(value, 12);
    const timers = Array.from({ length: steps }, (_, i) =>
      setTimeout(
        () => {
          setShown(Math.round((value * (i + 1)) / steps));
          onTick?.(i);
        },
        delay + (duration * (i + 1)) / steps,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [value, delay, duration]); // eslint-disable-line react-hooks/exhaustive-deps -- onTick is a sound, fine to read once
  return shown;
}
