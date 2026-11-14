import { createRandom } from '../../../lib/random.js';
import { BIOME_CREATURES, CREATURES } from './creatureArt.jsx';

/** Seconds for one trip (or one loop) by way of moving: plodders are slow, tumbleweeds quick. */
const DURATIONS = { walk: 64, crawl: 90, hop: 32, fly: 24, flutter: 28, roll: 17, dart: 20, paddle: 52, peck: 58, soar: 16, peek: 11 };

/**
 * Which animals wander through this level's landscape and how: two of the world's animals, picked by
 * the level, so every level in a world feels a little different. Sometimes a baby camel tags along.
 * The same level always gets the same animals.
 */
export function planCreatures(theme, seed) {
  const random = createRandom(`creatures-${seed}`);
  const ids = random.shuffle(BIOME_CREATURES[theme] ?? BIOME_CREATURES.sunshine).slice(0, 2);
  return ids.flatMap((id, i) => {
    const duration = DURATIONS[CREATURES[id].move] * (0.85 + random.next() * 0.3);
    const plan = {
      key: id,
      id,
      lane: i === 0 ? 0.15 + random.next() * 0.3 : 0.55 + random.next() * 0.35,
      duration,
      delay: -random.next() * duration * 0.6,
      isReversed: random.chance(0.5),
      x: 15 + random.next() * 70,
    };
    if (id !== 'camel' || !random.chance(0.45)) return [plan];
    // A baby camel follows its mum, a few steps behind.
    return [plan, { ...plan, key: 'babyCamel', scale: 0.6, delay: plan.delay + (plan.isReversed ? -2.6 : 2.6) }];
  });
}
