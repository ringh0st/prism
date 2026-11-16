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
import { PIECE_FIRST_LEVEL, piecesIn } from '../src/game/pieces.js';
import { MAX_RANDOM_SOLVE_RATE, randomSolveRate, solvesWithoutPlanning } from '../src/game/levelQuality.js';
import { REST_RECIPES } from '../src/game/recipes.js';
import { difficultyFor, generatorPresetFor, levelId, LEVELS_PER_WORLD, WORLD_COUNT } from '../src/game/worlds.js';
import { createRandom } from '../src/lib/random.js';
import { addDarkness } from '../src/game/darknessBuilder.js';
import { LEVEL_SCHEMA_VERSION } from '../src/game/constants.js';

const OUTPUT_DIR = new URL('../src/data/worlds/', import.meta.url);
const TIME_BUDGET_MS = 4000;
/** Boards a darkness level tries the darkness on (checking the safe orders takes a moment). */
const MAX_DARK_TRIES = 150;

export const worldFileName = (world) => `world-${String(world).padStart(3, '0')}.json`;

/** Ever-simpler versions of a preset, used when the full one is too complex to solve. */
function simplifications(preset) {
  // A light gate needs a second lamp to light its switch.
  const fewestLamps = preset.gates ? 2 : 1;
  return [
    preset,
    { ...preset, emitters: Math.max(fewestLamps, preset.emitters - 1), decoys: Math.max(0, preset.decoys - 2) },
    // More fixed mirrors make it easier to solve, but never before players have met them.
    {
      ...preset,
      emitters: fewestLamps,
      splits: Math.min(1, preset.splits ?? 0),
      decoys: 1,
      lockedRatio: preset.lockedRatio > 0 ? 0.25 : 0,
    },
    // Last resort for the biggest bosses: a smaller board with fewer extras.
    {
      ...preset,
      emitters: fewestLamps,
      width: Math.max(6, preset.width - 2),
      height: Math.max(6, preset.height - 2),
      splits: 0,
      decoys: 1,
      shades: 0,
      fog: 0,
    },
  ];
}

/** Tutorials, piece introductions and quick "rest" flavors may be easy; everything else needs a catch. */
const needsCatchFor = (world, index, preset) =>
  world <= CATCH_WORLDS && !(world === 1 && index <= 3) && !INTRO_LEVELS.has(levelId(world, index)) && !REST_RECIPES.includes(preset.recipe);
/** Levels that teach a new piece stay gentle. */
const INTRO_LEVELS = new Set(Object.values(PIECE_FIRST_LEVEL));
/** Every world is built with the catch check. */
const CATCH_WORLDS = 50;

function bestLevelFor(world, index) {
  const preset = generatorPresetFor(world, index);
  const needsCatch = needsCatchFor(world, index, preset);
  let best = null;
  let fallback = null; // the least random-solvable board, if none passes the catch check
  let darkTries = 0;
  for (const [attempt, variant] of simplifications(preset).entries()) {
    const deadline = Date.now() + TIME_BUDGET_MS;
    for (let seed = 0; seed < 400 && Date.now() < deadline; seed++) {
      const random = createRandom(`prism-${levelId(world, index)}-${attempt}-${seed}`);
      let level = generateLevel({ ...variant, minPar: Math.min(variant.minPar, 2) }, random, 25);
      // The darkness goes on top of a finished board (darknessBuilder.js); a board that can't take it is skipped.
      if (level && preset.darkness && level.par >= (best?.par ?? 0) && darkTries < MAX_DARK_TRIES) {
        darkTries++;
        level = addDarkness(level, preset.darkness, random, preset.maxPar);
      } else if (preset.darkness) level = null;
      // A level that introduces a piece must actually contain it.
      const hasRequired = !preset.mustHave || (level && piecesIn(level).includes(preset.mustHave));
      // Every regular level needs a real "catch": random tapping mustn't solve it, and nor may a player who just
      // lights the most each move without planning (levelQuality.js). Such a board counts as fully guessable.
      const rated = level && { ...level, difficulty: difficultyFor(index) };
      const rate = level && hasRequired && needsCatch ? (solvesWithoutPlanning(rated) ? 1 : randomSolveRate(rated)) : 0;
      if (level && hasRequired && level.par <= preset.maxPar && (!fallback || rate < fallback.rate)) fallback = { level, rate };
      if (level && hasRequired && level.par <= preset.maxPar && (!best || level.par > best.par) && rate <= MAX_RANDOM_SOLVE_RATE) best = level;
      if (best && best.par >= preset.minPar) return best;
    }
    // Only settle for a board one move short of the target (two for piece introductions, which stay gentle).
    if (best && best.par >= preset.minPar - (preset.mustHave ? 2 : 1)) return best;
  }
  if (!best && fallback) {
    console.warn(`${levelId(world, index)}: no board with a clear catch; using the hardest to guess (${Math.round(fallback.rate * 100)}%)`);
    best = fallback.level;
  }
  if (!best) throw new Error(`Could not generate ${levelId(world, index)}`);
  return best;
}

function generateWorld(world) {
  const levels = [];
  for (let index = 1; index <= LEVELS_PER_WORLD; index++) {
    const level = bestLevelFor(world, index);
    const preset = generatorPresetFor(world, index);
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
      ...(preset.recipe ? { recipe: preset.recipe } : {}),
      tiles: level.tiles,
      ...(level.glooms ? { glooms: level.glooms } : {}),
      ...(level.eclipse ? { eclipse: level.eclipse } : {}),
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
