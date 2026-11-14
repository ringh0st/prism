// Generates the built-in level pack: one JSON file per world in src/data/worlds/.
// Run: npm run levels            (all worlds, in parallel)
//      npm run levels -- 5 6 7   (only these worlds)
//
// For each level the generator searches for a while and keeps the hardest valid puzzle
// it finds (highest par), stopping early once the target is reached.
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { generateLevel } from '../src/game/generator.js';
import { analyzeLevel } from '../src/game/solver.js';
import { validateLevel } from '../src/game/levelSchema.js';
import { difficultyFor, generatorPresetFor, levelId, LEVELS_PER_WORLD, WORLD_COUNT } from '../src/game/worlds.js';
import { createRandom } from '../src/lib/random.js';
import { LEVEL_SCHEMA_VERSION } from '../src/game/constants.js';

const OUTPUT_DIR = new URL('../src/data/worlds/', import.meta.url);
const TIME_BUDGET_MS = 2500;

export const worldFileName = (world) => `world-${String(world).padStart(3, '0')}.json`;

/** Ever-simpler versions of a preset, used when the full one is too complex to solve. */
function simplifications(preset) {
  return [
    preset,
    { ...preset, emitters: Math.max(1, preset.emitters - 1), decoys: Math.max(0, preset.decoys - 2) },
    // More fixed mirrors make it easier to solve, but never before players have met them.
    { ...preset, emitters: 1, splits: Math.min(1, preset.splits ?? 0), decoys: 1, lockedRatio: preset.lockedRatio > 0 ? 0.25 : 0 },
  ];
}

function bestLevelFor(world, index) {
  const preset = generatorPresetFor(world, index);
  let best = null;
  for (const [attempt, variant] of simplifications(preset).entries()) {
    const deadline = Date.now() + TIME_BUDGET_MS;
    for (let seed = 0; seed < 400 && Date.now() < deadline; seed++) {
      const random = createRandom(`prism-${levelId(world, index)}-${attempt}-${seed}`);
      const level = generateLevel({ ...variant, minPar: Math.min(variant.minPar, 2) }, random, 25);
      // A level that introduces a piece must actually contain it.
      const hasRequired = !preset.mustHaveLocked || level?.tiles.some((tile) => tile.locked);
      if (level && hasRequired && level.par <= preset.maxPar && (!best || level.par > best.par)) best = level;
      if (best && best.par >= preset.minPar) return best;
    }
    if (best && best.par >= preset.minPar - 2) return best;
  }
  if (!best) throw new Error(`Could not generate ${levelId(world, index)}`);
  return best;
}

function generateWorld(world) {
  const levels = [];
  for (let index = 1; index <= LEVELS_PER_WORLD; index++) {
    const level = bestLevelFor(world, index);
    const check = analyzeLevel(level);
    const problems = validateLevel(level);
    if (problems.length || !check.isSolvable || check.par !== level.par) {
      throw new Error(`${levelId(world, index)} failed validation: ${problems.join(' ')}`);
    }
    levels.push({
      id: levelId(world, index),
      version: LEVEL_SCHEMA_VERSION,
      world,
      index,
      difficulty: difficultyFor(index),
      width: level.width,
      height: level.height,
      par: level.par,
      tiles: level.tiles,
    });
  }
  writeFileSync(new URL(worldFileName(world), OUTPUT_DIR), JSON.stringify(levels) + '\n');
  const pars = levels.map((l) => l.par);
  return `world ${String(world).padStart(2)}: par ${Math.min(...pars)}–${Math.max(...pars)}, boss par ${pars.at(-1)}, sizes ${levels[0].width}–${Math.max(...levels.map((l) => l.width))}`;
}

if (isMainThread) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const requested = process.argv.slice(2).map(Number).filter(Boolean);
  const queue = requested.length ? requested : Array.from({ length: WORLD_COUNT }, (_, i) => i + 1);
  const workerCount = Math.min(cpus().length, queue.length);
  let active = 0;
  const startNext = () => {
    const world = queue.shift();
    if (world === undefined) return;
    active++;
    const worker = new Worker(fileURLToPath(import.meta.url), { workerData: { world } });
    worker.on('message', (line) => console.log(line));
    worker.on('error', (error) => {
      console.error(error);
      process.exitCode = 1;
    });
    worker.on('exit', () => {
      active--;
      startNext();
      if (active === 0 && queue.length === 0) console.log('Done.');
    });
  };
  for (let i = 0; i < workerCount; i++) startNext();
} else {
  parentPort.postMessage(generateWorld(workerData.world));
}
