// Generates the built-in level pack: one JSON file per world in src/data/worlds/.
// Run: npm run levels            (all worlds, in parallel)
//      npm run levels -- 5 6 7   (only these worlds)
//
// For each level the generator searches for a while within the level's piece budget and keeps the board whose felt
// difficulty (feltDifficulty in levelQuality.js) is closest to the level's place on a road that only climbs
// (difficultyTargetFor in worlds.js). No board shape is used twice.
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { generateLevel } from '../src/game/generator.js';
import { analyzeLevel } from '../src/game/solver.js';
import { validateLevel } from '../src/game/levelSchema.js';
import { PIECE_FIRST_LEVEL, piecesIn } from '../src/game/pieces.js';
import { MAX_RANDOM_SOLVE_RATE, feltDifficulty, shapeKey, trickScore } from '../src/game/levelQuality.js';
import { difficultyFor, difficultyTargetFor, generatorPresetFor, levelId, LEVELS_PER_WORLD, WORLD_COUNT } from '../src/game/worlds.js';
import { createRandom } from '../src/lib/random.js';
import { addDarkness } from '../src/game/darknessBuilder.js';
import { DIFFICULTY, LEVEL_SCHEMA_VERSION } from '../src/game/constants.js';

const OUTPUT_DIR = new URL('../src/data/worlds/', import.meta.url);
const TIME_BUDGET_MS = 6000;
/** Boards a darkness level tries the darkness on (checking the safe orders takes a moment). */
const MAX_DARK_TRIES = 400;

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

/** Levels that teach a new piece stay gentle. */
const INTRO_LEVELS = new Set(Object.values(PIECE_FIRST_LEVEL));
/** Levels 1–3 teach the game one mirror at a time; up to this level number a board may still be solved by the obvious moves. */
const TUTORIAL_LEVELS = 3;
const GENTLE_UNTIL = 12;
/** A level may sit this far under the one before it, never further (the road only climbs). */
const MAX_DROP = 1;

/**
 * The board for one level: among everything the search finds in its time, the one whose felt difficulty is closest
 * to the level's place on the road (difficultyTargetFor), never easier than `floor`, and never a shape already used.
 * @returns {{ level, rating }} rating: its felt difficulty (null for the three tutorial levels)
 */
function bestLevelFor(world, index, { floor, usedShapes }) {
  const preset = generatorPresetFor(world, index);
  const number = (world - 1) * LEVELS_PER_WORLD + index;
  const isTutorial = number <= TUTORIAL_LEVELS;
  const isIntro = INTRO_LEVELS.has(levelId(world, index));
  // From here on the obvious move must not solve it, and nor may guessing (levelQuality.js).
  const needsCatch = number > GENTLE_UNTIL && !isIntro;
  // A level that teaches a piece sits a little under the road; it isn't held to the level before it.
  const target = difficultyTargetFor(world, index) - (isIntro ? 2 : 0);
  const lowest = isIntro ? -Infinity : floor;
  // A level that introduces a piece must show it (small boards don't always fit it by chance).
  const required =
    preset.mustHave ?? Object.keys(PIECE_FIRST_LEVEL).find((piece) => PIECE_FIRST_LEVEL[piece] === levelId(world, index) && piece !== 'basics');
  let best = null; // closest to the target among boards that fit every rule
  let hardest = null; // the hardest board in range, if none fits every rule
  for (const [attempt, variant] of simplifications(preset).entries()) {
    let darkTries = 0; // each simpler version gets its own tries (small boards take the darkness less often)
    const deadline = Date.now() + TIME_BUDGET_MS;
    for (let seed = 0; seed < 4000 && Date.now() < deadline; seed++) {
      const random = createRandom(`prism-${levelId(world, index)}-${attempt}-${seed}`);
      let level = generateLevel({ ...variant, minPar: Math.min(variant.minPar, 2) }, random, 25);
      // The darkness goes on top of a finished board (darknessBuilder.js); a board that can't take it is skipped.
      if (level && preset.darkness && darkTries < MAX_DARK_TRIES) {
        darkTries++;
        level = addDarkness(level, preset.darkness, random, preset.maxPar);
      } else if (preset.darkness) level = null;
      if (!level || level.par > preset.maxPar) continue;
      // A level that introduces a piece must actually contain it.
      if (required && !piecesIn(level).includes(required)) continue;
      if (usedShapes.has(shapeKey(level))) continue;
      if (isTutorial) {
        // The tutorial boards just need to fit: the plainest one.
        if (level.par === preset.minPar && (!best || level.tiles.length < best.level.tiles.length)) best = { level, rating: null, miss: 0 };
        continue;
      }
      const rated = { ...level, difficulty: difficultyFor(index) };
      const trick = trickScore(rated);
      const rating = feltDifficulty(rated, trick);
      if (!hardest || rating > hardest.rating) hardest = { level, rating };
      if (needsCatch && (!trick.greedyFails || trick.randomRate > MAX_RANDOM_SOLVE_RATE)) continue;
      if (rating < lowest) continue;
      const miss = Math.abs(rating - target);
      if (!best || miss < best.miss) best = { level, rating, miss };
    }
    if (best) return best;
  }
  if (hardest) {
    console.warn(
      `${levelId(world, index)}: no board on the road (wanted ${target.toFixed(1)}); using the hardest found (${hardest.rating.toFixed(1)})`,
    );
    return hardest;
  }
  throw new Error(`Could not generate ${levelId(world, index)}`);
}

function generateWorld(world) {
  const levels = [];
  const usedShapes = new Set();
  const ratings = [];
  // The road so far: the last normal level's difficulty (a Hard level or a boss stands above the road, not on it).
  let road = difficultyTargetFor(world, 1) - 2;
  for (let index = 1; index <= LEVELS_PER_WORLD; index++) {
    const isNormal = difficultyFor(index) === DIFFICULTY.NORMAL;
    // A Hard level or a boss must stand clearly above the road.
    const { level, rating } = bestLevelFor(world, index, { floor: isNormal ? road - MAX_DROP : road + 1, usedShapes });
    usedShapes.add(shapeKey(level));
    ratings.push(rating);
    if (isNormal && rating !== null && !INTRO_LEVELS.has(levelId(world, index))) road = Math.max(road, rating);
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
  return `world ${String(world).padStart(2)}: ${ratings.map((rating) => (rating === null ? '–' : rating.toFixed(0))).join(' ')}`;
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
