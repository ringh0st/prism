// The computer player: it tries many shots in its head (the physics is exact, so it can) and plays the best one,
// with a shaky hand that depends on the level.
import { isLive } from './physics.js';
import { other, tryShot } from './rules.js';

export const LEVELS = {
  easy: { name: 'Easy', wobble: 0.11, tries: 14 },
  normal: { name: 'Normal', wobble: 0.05, tries: 30 },
  hard: { name: 'Hard', wobble: 0.015, tries: 60 },
};

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
    // Straight at a marble, or a little to one side of it for a cut.
    const angle = Math.atan2(aim.y - me.y, aim.x - me.x) + (rnd() - 0.5) * 0.16;
    const power = 0.3 + rnd() * 0.7;
    const result = tryShot(game, angle, power);
    const score = result.won * 10 - (result.foul ? 8 : 0) + result.hits * 0.5 + rnd() * 0.2;
    if (score > best.score) best = { angle, power, score };
  }
  return { angle: best.angle + (rnd() - 0.5) * 2 * wobble, power: Math.max(0.1, Math.min(1, best.power + (rnd() - 0.5) * wobble * 2)) };
}
