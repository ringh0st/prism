import { solvedLevelCount } from './pals.js';

/*
 * Treats: every third solved level, your partner Pal finds one. Feed them on the Pals screen for a
 * happy munch and a little trick. How many were found comes from the solved levels; only how many were
 * eaten is kept (on this device).
 */
export const TREAT_EVERY = 3;
export const TREATS = [
  { id: 'cookie', name: 'cookie', emoji: '🍪' },
  { id: 'berry', name: 'berry', emoji: '🫐' },
  { id: 'starCandy', name: 'star candy', emoji: '🍬' },
  { id: 'honey', name: 'honey drop', emoji: '🍯' },
  { id: 'apple', name: 'apple', emoji: '🍎' },
  { id: 'cupcake', name: 'cupcake', emoji: '🧁' },
];
/** "a cookie", "an apple". */
export const withArticle = (treat) => `${/^[aeiou]/.test(treat.name) ? 'an' : 'a'} ${treat.name}`;

export const TRICKS = ['backflip', 'twirl', 'juggle', 'hearts', 'bounce', 'wave'];

export const treatsFound = (levels) => Math.floor(solvedLevelCount(levels) / TREAT_EVERY);

/** The n-th treat found (they take turns). */
export const treatNumber = (n) => TREATS[(n - 1) % TREATS.length];

/** Treats waiting to be eaten. */
export const treatsWaiting = (progress) => Math.max(0, treatsFound(progress.levels) - (progress.treatsFed ?? 0));

/** The next treat in the bag (the oldest one not eaten yet). */
export const nextTreat = (progress) => treatNumber((progress.treatsFed ?? 0) + 1);

/** The treat this solve found, if solving it made the count reach the next treat (else null). */
export function treatFoundBy(levelsBefore, levelsAfter) {
  const before = treatsFound(levelsBefore);
  const after = treatsFound(levelsAfter);
  return after > before ? treatNumber(after) : null;
}

/** Eat one treat. @returns { progress, treat, trick } or null when the bag is empty. */
export function feedTreat(progress, roll = Math.random()) {
  if (treatsWaiting(progress) === 0) return null;
  const treat = nextTreat(progress);
  return { progress: { ...progress, treatsFed: (progress.treatsFed ?? 0) + 1 }, treat, trick: TRICKS[Math.floor(roll * TRICKS.length)] };
}
