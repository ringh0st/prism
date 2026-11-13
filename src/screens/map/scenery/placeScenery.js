import { createRandom } from '../../../lib/random.js';
import { BIOMES, SCENERY } from './sceneryArt.jsx';

const BIG_SCALE = 1.3;
const SIZE_VARIATION = 0.15;

/**
 * Scatter scenery beside the road, never on it: each stop gets ground patches, a big piece on the
 * side the road is not on, and small fillers. Seeded by world id, so a world always looks the same.
 * @returns [{ kind, x (% of width), y (px, bottom of the piece), size, flip }]
 */
export function placeScenery(stops, worldId, theme) {
  const biome = BIOMES[theme] ?? BIOMES.sunshine;
  const random = createRandom(`scenery-${worldId}`);
  const patches = [];
  const pieces = [];
  const add = (kind, x, y, scale = 1) => {
    const variation = 1 + (random.next() * 2 - 1) * SIZE_VARIATION;
    pieces.push({ kind, x, y, size: Math.round(SCENERY[kind].size * scale * variation), flip: random.chance(0.5) });
  };

  stops.forEach((stop) => {
    const side = stop.x > 50 ? 'left' : stop.x < 50 ? 'right' : random.pick(['left', 'right']);
    const zone = side === 'left' ? [2, 24] : [76, 98];
    patches.push({ kind: 'patch', x: random.int(10, 90), y: stop.y + random.int(-30, 40), size: random.int(130, 200), flip: false });
    if (random.chance(0.9)) add(random.pick(biome.big), random.int(zone[0] + 6, zone[1] - 6), stop.y + random.int(14, 40), BIG_SCALE);
    for (let i = random.int(1, 2); i > 0; i--) add(random.pick(biome.small), random.int(...zone), stop.y - random.int(-10, 44));
    // A little something on the road's own side too, tucked against the edge.
    if (stop.x !== 50 && random.chance(0.45)) {
      const nearEdge = side === 'left' ? random.int(94, 99) : random.int(1, 6);
      add(random.pick(biome.small), nearEdge, stop.y - random.int(20, 44));
    }
  });
  // Ground first, then pieces from far (higher up) to near so nearer ones overlap.
  return [...patches, ...pieces.sort((a, b) => a.y - b.y)];
}
