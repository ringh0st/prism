import { useEffect, useRef, useState } from 'react';
import { isNapTime, napSpot, nextActivity, timeOfDay } from '../game/groveLife.js';

const STEP_MS = [4200, 7000];
const WALK_MS = 2400;
const EMOTE_MS = 2600;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Brings the partner Pal to life: where it stands, which way it faces, whether it's walking, its current
 * emote, and the time of day. Stays put (but still emotes) for players who prefer reduced motion.
 */
export function usePalLife(spots) {
  const [clock, setClock] = useState(() => new Date());
  const isNapping = isNapTime(clock);
  const [place, setPlace] = useState(() => (isNapping ? napSpot(spots) : { left: 50, top: 74 }));
  const [facing, setFacing] = useState(1);
  const [isWalking, setIsWalking] = useState(false);
  const [emote, setEmote] = useState(null);
  const placeRef = useRef(place);
  const spotsKey = spots.join(',');

  // Check the clock every minute (morning turns into day, evening into night).
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const show = (next) => {
      setEmote(next);
      later(() => setEmote(null), EMOTE_MS);
    };

    if (isNapping) {
      const bed = napSpot(spots);
      placeRef.current = bed;
      setPlace(bed);
      setIsWalking(false);
      const snore = () => {
        show({ symbol: 'z', key: Date.now() });
        later(snore, 3500);
      };
      snore();
      return () => timers.forEach(clearTimeout);
    }

    const step = () => {
      const activity = nextActivity(spots);
      if (!reducedMotion()) {
        const from = placeRef.current;
        setFacing(activity.left < from.left ? -1 : 1);
        setIsWalking(true);
        placeRef.current = activity;
        setPlace(activity);
        later(() => setIsWalking(false), WALK_MS);
      }
      if (activity.emote) later(() => show({ symbol: activity.emote, line: activity.line, key: Date.now() }), reducedMotion() ? 0 : WALK_MS);
      later(step, STEP_MS[0] + Math.random() * (STEP_MS[1] - STEP_MS[0]));
    };
    later(step, 1500);
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when the decor or nap time changes
  }, [spotsKey, isNapping]);

  return { place, facing, isWalking, emote, isNapping, time: timeOfDay(clock), walkMs: WALK_MS };
}
