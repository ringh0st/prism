// Generates the built-in level pack (src/data/seedLevels.json).
// Run: npm run levels
// Deterministic: the same code always produces the same levels.
import { writeFileSync } from 'node:fs';
import { generateLevel } from '../src/game/generator.js';
import { analyzeLevel } from '../src/game/solver.js';
import { validateLevel } from '../src/game/levelSchema.js';
import { difficultyFor, generatorPresetFor, levelId, LEVELS_PER_WORLD, WORLDS } from '../src/game/worlds.js';
import { createRandom } from '../src/lib/random.js';
import { LEVEL_SCHEMA_VERSION } from '../src/game/constants.js';

const SEEDS_PER_LEVEL = 24;

function bestLevelFor(world, index) {
  const preset = generatorPresetFor(world, index);
  // Try the full target first, then relax the minimum moves one step at a time.
  for (let minPar = preset.minPar; minPar >= 1; minPar--) {
    let best = null;
    for (let seed = 0; seed < SEEDS_PER_LEVEL; seed++) {
      const random = createRandom(`prism-${levelId(world, index)}-${seed}`);
      const level = generateLevel({ ...preset, minPar }, random, 120);
      if (level && (!best || level.par > best.par)) best = level;
      if (best && best.par >= preset.minPar) break;
    }
    if (best) return best;
  }
  throw new Error(`Could not generate ${levelId(world, index)}`);
}

const levels = [];
for (const world of WORLDS) {
  for (let index = 1; index <= LEVELS_PER_WORLD; index++) {
    const level = bestLevelFor(world.id, index);
    const problems = validateLevel(level);
    const check = analyzeLevel(level);
    if (problems.length || !check.isSolvable || check.par !== level.par) {
      throw new Error(`${levelId(world.id, index)} failed validation: ${problems.join(' ')}`);
    }
    levels.push({
      id: levelId(world.id, index),
      version: LEVEL_SCHEMA_VERSION,
      world: world.id,
      index,
      difficulty: difficultyFor(index),
      width: level.width,
      height: level.height,
      par: level.par,
      tiles: level.tiles,
    });
    process.stdout.write(`${levelId(world.id, index)} ${difficultyFor(index).padEnd(6)} ${level.width}x${level.height} par ${level.par}\n`);
  }
}
writeFileSync(new URL('../src/data/seedLevels.json', import.meta.url), JSON.stringify(levels) + '\n');
console.log(`\nWrote ${levels.length} levels.`);
