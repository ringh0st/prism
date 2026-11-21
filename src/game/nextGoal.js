import { FRIEND_AFTER_LEVELS, solvedCount } from './firstFriend.js';
import { presentProgress, presentsWaiting } from './gifts.js';

/*
 * The closest prize, so there is always one clear thing to play for (what keeps players in casual games: the next
 * reward is always in sight). One of:
 *  - friend:  levels until the first Pal turns up
 *  - present: stars until the Pal's next present
 *  - world:   levels until the current world is finished (a new world, a new piece)
 * @param levelsLeftInWorld unsolved levels in the world the player is in
 * @returns {{ kind, left, unit: 'levels' | 'stars' } | null} null when a present is already waiting or nothing is near
 */
export function nextGoalFor(progress, levelsLeftInWorld) {
  const goals = [];
  if (!progress.pal?.id) {
    goals.push({ kind: 'friend', left: FRIEND_AFTER_LEVELS - solvedCount(progress.levels), unit: 'levels' });
  } else {
    if (presentsWaiting(progress) > 0) return null;
    const { have, need } = presentProgress(progress);
    goals.push({ kind: 'present', left: need - have, unit: 'stars' });
  }
  if (levelsLeftInWorld > 0) goals.push({ kind: 'world', left: levelsLeftInWorld, unit: 'levels' });
  // A star takes about a third of a level to earn, so the two units are weighed against each other.
  const effort = (goal) => (goal.unit === 'stars' ? goal.left / 2.5 : goal.left);
  return goals.filter((goal) => goal.left > 0).sort((a, b) => effort(a) - effort(b))[0] ?? null;
}
