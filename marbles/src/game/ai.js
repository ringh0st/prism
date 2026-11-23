// The computer player: it tries many shots in its head (the physics is exact, so it can) and plays the best one,
// with a shaky hand that depends on the level.
import { isLive } from './physics.js';
import { other, tryShot } from './rules.js';

export const LEVELS = {
  easy: { name: 'Easy', wobble: 0.11, tries: 14 },
  normal: { name: 'Normal', wobble: 0.05, tries: 30 },
  hard: { name: 'Hard', wobble: 0.015, tries: 60 },
};

/** The nearest point outside the ring for a marble lying in it. */
function outOfRing(ring, m) {
  const d = Math.hypot(m.x - ring.x, m.y - ring.y) || 1;
  return { x: ring.x + ((m.x - ring.x) / d) * (ring.r + 40), y: ring.y + ((m.y - ring.y) / d) * (ring.r + 40) };
}

/** The shot the computer takes for `side`: { angle, power }. `rnd` gives 0…1. */
export function pickShot(game, side, level, rnd = Math.random) {
  const { world, mode } = game;
  const me = world.marbles.find((m) => m.id === side);
  const aims = mode === 'chase' ? [world.marbles.find((m) => m.id === other(side))] : world.marbles.filter((m) => !m.owner && isLive(m));
  let best = { angle: Math.atan2(world.h / 2 - me.y, world.w / 2 - me.x), power: 0.5, score: -Infinity };
  const { tries, wobble } = LEVELS[level];
  for (let i = 0; i < tries; i++) {
    const aim = aims[Math.floor(rnd() * aims.length)];
    if (!aim) break;
    // Where to send the marble it aims at: into the hole, or out of the ring by the shortest way. To send a marble
    // somewhere, the shooter must strike it on the far side: it aims at the spot one marble behind it.
    let spot = aim;
    const goal = world.hole ?? (world.ring && !aim.owner ? outOfRing(world.ring, aim) : null);
    if (goal && rnd() < 0.7) {
      const d = Math.hypot(goal.x - aim.x, goal.y - aim.y) || 1;
      spot = { x: aim.x - ((goal.x - aim.x) / d) * (aim.r + me.r), y: aim.y - ((goal.y - aim.y) / d) * (aim.r + me.r) };
    }
    const angle = Math.atan2(spot.y - me.y, spot.x - me.x) + (rnd() - 0.5) * 0.08;
    // Soft shots matter as much as hard ones: a marble has to arrive slowly to drop into the hole.
    const power = 0.08 + rnd() * 0.92;
    const result = tryShot(game, angle, power);
    const score = result.won * 10 - (result.foul ? 8 : 0) + result.hits * 0.5 + rnd() * 0.2;
    if (score > best.score) best = { angle, power, score };
  }
  return { angle: best.angle + (rnd() - 0.5) * 2 * wobble, power: Math.max(0.1, Math.min(1, best.power + (rnd() - 0.5) * wobble * 2)) };
}
