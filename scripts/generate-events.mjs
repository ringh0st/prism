// Makes the weekend event puzzles ahead of time: one JSON file per weekend in src/data/events/.
// Run: npm run events                 (every weekend from this one through the end of next year)
//      npm run events -- 2026-11-14   (only these weekends)
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { generateLevel } from '../src/game/generator.js';
import { analyzeLevel } from '../src/game/solver.js';
import { validateLevel } from '../src/game/levelSchema.js';
import { EVENT_LEVELS, eventLevelInfo, eventPresetFor, eventThemeFor, nextEventWeekend } from '../src/game/events.js';
import { todayKey } from '../src/game/daily.js';
import { createRandom } from '../src/lib/random.js';
import { LEVEL_SCHEMA_VERSION } from '../src/game/constants.js';

const OUTPUT_DIR = new URL('../src/data/events/', import.meta.url);
const TIME_BUDGET_MS = 2500;

/** Keeps the hardest valid puzzle it finds within the time budget, easing the target if needed. */
function bestLevelFor(weekend, number) {
  const preset = eventPresetFor(eventThemeFor(weekend), number);
  let best = null;
  const deadline = Date.now() + TIME_BUDGET_MS * 2;
  for (let seed = 0; seed < 600 && (Date.now() < deadline || !best); seed++) {
    const level = generateLevel({ ...preset, minPar: 2 }, createRandom(`event-${weekend}-${number}-${seed}`), 25);
    if (level && level.par <= preset.maxPar && (!best || level.par > best.par)) best = level;
    if (best && best.par >= preset.minPar) break;
  }
  if (!best) throw new Error(`Could not generate ${weekend} #${number}`);
  return best;
}

function generateWeekend(weekend) {
  const puzzles = Array.from({ length: EVENT_LEVELS }, (_, i) => {
    const level = bestLevelFor(weekend, i + 1);
    const check = analyzeLevel(level);
    const problems = validateLevel(level);
    if (problems.length || !check.isSolvable || check.par !== level.par)
      throw new Error(`${weekend} #${i + 1} failed validation: ${problems.join(' ')}`);
    return level;
  });
  // Easiest first, so the weekend climbs smoothly.
  puzzles.sort((a, b) => a.par - b.par || a.width - b.width);
  const levels = puzzles.map((level, i) => ({
    ...eventLevelInfo(weekend, i + 1),
    version: LEVEL_SCHEMA_VERSION,
    width: level.width,
    height: level.height,
    par: level.par,
    tiles: level.tiles,
  }));
  writeFileSync(new URL(`${weekend}.json`, OUTPUT_DIR), JSON.stringify(levels) + '\n');
  return `${weekend} ${eventThemeFor(weekend).name}: par ${levels.map((l) => l.par).join(',')}`;
}

/** Every Saturday from this weekend through the end of next year. */
function upcomingWeekends() {
  const weekends = [];
  const day = new Date(`${nextEventWeekend(new Date(Date.now() - 86_400_000))}T12:00:00`);
  const end = new Date(day.getFullYear() + 1, 11, 31);
  for (; day <= end; day.setDate(day.getDate() + 7)) weekends.push(todayKey(day));
  return weekends;
}

if (isMainThread) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const requested = process.argv.slice(2);
  const queue = requested.length ? requested : upcomingWeekends().filter((weekend) => !existsSync(new URL(`${weekend}.json`, OUTPUT_DIR)));
  let active = 0;
  const startNext = () => {
    const weekend = queue.shift();
    if (weekend === undefined) return;
    active++;
    const worker = new Worker(fileURLToPath(import.meta.url), { workerData: { weekend } });
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
  for (let i = 0; i < Math.min(cpus().length, queue.length); i++) startNext();
} else {
  parentPort.postMessage(generateWeekend(workerData.weekend));
}
