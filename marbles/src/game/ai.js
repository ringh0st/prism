// The computer player: it tries many shots in its head (the physics is exact, so it can) and plays the best one,
// with a shaky hand that depends on the level.
import { isLive, ringCorners, strayOf } from './physics.js';
import { other, tryShot } from './rules.js';

export const LEVELS = {
  // `stray` is how much of a player's own stray the computer's flicks have (physics.js strayOf).
  easy: { name: 'Easy', wobble: 0.06, tries: 16, stray: 1.4 },
  normal: { name: 'Normal', wobble: 0.02, tries: 40, stray: 1 },
  hard: { name: 'Hard', wobble: 0.004, tries: 90, stray: 0.55 },
  // A perfect hand, only for checking that a challenge can be done at all (not offered as a rival).
  sure: { name: 'Sure', wobble: 0, tries: 90, stray: 0 },
};

/** The nearest point outside the ring for a marble lying in it. */
function outOfRing(ring, m) {
  const corners = ringCorners(ring);
  if (corners) {
    // The nearest side of a triangle or square: straight out across it.
    let best = null;
    for (let i = 0; i < corners.length; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % corners.length];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      const depth = ((b.x - a.x) * (m.y - a.y) - (b.y - a.y) * (m.x - a.x)) / length;
      if (!best || depth < best.depth) best = { depth, nx: (b.y - a.y) / length, ny: -(b.x - a.x) / length };
    }
    return { x: m.x + best.nx * (best.depth + 40), y: m.y + best.ny * (best.depth + 40) };
  }
  const d = Math.hypot(m.x - ring.x, m.y - ring.y) || 1;
  return { x: ring.x + ((m.x - ring.x) / d) * (ring.r + 40), y: ring.y + ((m.y - ring.y) / d) * (ring.r + 40) };
}

/** The shot the computer takes for `side`: { angle, power }. `rnd` gives 0…1. */
export function pickShot(game, side, level, rnd = Math.random) {
  const { world, mode } = game;
  const me = world.marbles.find((m) => m.id === side);
  // It goes for the other side's marbles (in the ring game its own are worth nothing to it).
  const aims = mode === 'chase' ? [world.marbles.find((m) => m.id === other(side))] : world.marbles.filter((m) => !m.owner && isLive(m) && m.team !== side);
  let best = { angle: Math.atan2(world.h / 2 - me.y, world.w / 2 - me.x), power: 0.5, score: -Infinity };
  const { tries, wobble, stray } = LEVELS[level];
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
    // A flick strays, so a good shot is one that still works a little to either side.
    const lean = strayOf(power) * stray * 0.6;
    let score = rnd() * 0.2;
    for (const offset of [0, lean, -lean]) {
      const result = tryShot(game, angle + offset, power);
      score += (result.won * 10 - result.lost * 12 - (result.foul ? 8 : 0) + result.hits * 0.3) / 3;
    }
    if (score > best.score) best = { angle, power, score };
  }
  // Its hand shakes and its flick strays, like a player's; the harder the level, the less.
  const power = Math.max(0.1, Math.min(1, best.power + (rnd() - 0.5) * wobble * 2));
  return { angle: best.angle + (rnd() - 0.5) * 2 * wobble + (rnd() * 2 - 1) * strayOf(power) * stray, power };
}
