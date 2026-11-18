import { useEffect, useRef, useState } from 'react';
import { COATS, LumiKin } from './LumiKin.jsx';

const AGES = ['baby', 'kid', 'girl', 'mom', 'dad', 'grandma'];
/** Which family member waits on this tile: fixed for the level (seeded by level id and tile), so it never changes. */
export function lumiAgeFor(levelId, tileIndex) {
  let hash = tileIndex * 31;
  for (const char of levelId) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return AGES[hash % AGES.length];
}

/**
 * Its coat: Lumis waiting for plain sunlight each get their own bright color, different for every Lumi on the board
 * (`order` is its place among the level's Lumis). One that needs a colored light wears that light's color instead.
 */
export function lumiCoatFor(levelId, order, color) {
  if (color !== 'sun') return null;
  let hash = 7;
  for (const char of levelId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COATS[(hash + order) % COATS.length];
}

/** The rescue moment, face by face: surprised ("oh!") → joy (^ ^, a hop) → happy. Straight to happy for reduced motion. */
const RESCUE = [
  ['surprised', 0],
  ['joy', 280],
  ['happy', 1100],
];

/**
 * A Lumi waiting to be saved on a target tile. Asleep in its shadow bubble until its light reaches it; worried while
 * one of Smudge's shadows is close; then it plays the rescue faces once.
 */
export default function RescuedLumi({ color, age, coat, isLit, isWorried, calm }) {
  const [mood, setMood] = useState(isLit ? 'happy' : 'sleepy');
  const wasLit = useRef(isLit);
  useEffect(() => {
    if (isLit === wasLit.current) return undefined;
    wasLit.current = isLit;
    if (!isLit) {
      setMood('sleepy');
      return undefined;
    }
    if (calm) {
      setMood('happy');
      return undefined;
    }
    const timers = RESCUE.map(([face, at]) => setTimeout(() => setMood(face), at));
    return () => timers.forEach(clearTimeout);
  }, [isLit, calm]);
  const face = !isLit && isWorried ? 'worried' : mood;
  const isFree = isLit && face !== 'surprised';
  return <LumiKin color={color} age={age} coat={coat} on={isFree} mood={face} />;
}
