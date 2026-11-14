import { useEffect, useRef, useState } from 'react';
import { napSpot, nextActivity } from '../game/groveLife.js';

const STEP_MS = [4200, 7000];
const WALK_MS = 2400;
const EMOTE_MS = 2600;
const ACTION_MS = 1800;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Brings a Pal in the Grove to life: where it stands, which way it faces, whether it's walking and its
 * current emote. Naps in its bed spot when `isNapping`. Stays put (but still emotes) for players who
 * prefer reduced motion.
 * @param spots  Grove spots with decor it can visit
 * @param start  where it first stands ({ left, top } in % of the scene)
 */
export function usePalLife({ spots, isNapping = false, start = { left: 50, top: 74 } }) {
  const [place, setPlace] = useState(() => (isNapping ? napSpot(spots) : start));
  const [facing, setFacing] = useState(1);
  const [isWalking, setIsWalking] = useState(false);
  const [emote, setEmote] = useState(null);
  const [action, setAction] = useState(null);
  const placeRef = useRef(place);
  const spotsKey = spots.join(',');

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
      const moves = activity.left !== undefined && !reducedMotion();
      if (moves) {
        setFacing(activity.left < placeRef.current.left ? -1 : 1);
        setIsWalking(true);
        placeRef.current = { left: activity.left, top: activity.top };
        setPlace(placeRef.current);
        later(() => setIsWalking(false), WALK_MS);
      }
      const arrive = moves ? WALK_MS : 0;
      if (activity.emote) later(() => show({ symbol: activity.emote, line: activity.line, key: Date.now() }), arrive);
      // Then do something there: sit on the bench, splash, jump, spin, dance…
      if (activity.action && !reducedMotion()) {
        later(() => setAction({ name: activity.action, key: Date.now() }), arrive);
        later(() => setAction(null), arrive + ACTION_MS);
      }
      later(step, STEP_MS[0] + Math.random() * (STEP_MS[1] - STEP_MS[0]));
    };
    later(step, 1500 + Math.random() * 1500);
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when the decor or nap time changes
  }, [spotsKey, isNapping]);

  return { place, facing, isWalking, emote, action, walkMs: WALK_MS };
}
