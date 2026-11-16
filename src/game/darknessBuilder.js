/*
 * Adds the darkness (darkness.js) to a generated level for the level builder: voids that cut off the easy
 * routes, an eclipse, a dying lamp, fading gems and creeping shadows. Every addition is checked: the fewest-taps
 * solution must still win in at least one order, and for the timed pieces the order has to matter (random orders
 * should often lose), so the darkness adds real tension rather than decoration.
 */
import { TILE } from './constants.js';
import { buildCellIndex, cellsOnBeams, traceBeams } from './beam.js';
import { analyzeLevel } from './solver.js';
import { darknessStart, findSafeOrder, orderRisk, ticksAfter } from './darkness.js';

const popcount = (n) => n.toString(2).replaceAll('0', '').length;
const startOrientsOf = (level) => level.tiles.map((tile) => tile.orient ?? 0);
const cellOf = (level, tile) => tile.y * level.width + tile.x;

/** The fewest-taps solutions: { par, options: [{ tapGroups, solved }] }, or null if unsolvable. */
function cheapestSolutions(level) {
  const analysis = analyzeLevel(level);
  if (!analysis.isSolvable || analysis.tooComplex) return null;
  const start = startOrientsOf(level);
  const options = analysis.solutions
    .filter((solution) => popcount(solution.mask) === analysis.par)
    .slice(0, 4)
    .map(({ mask }) => {
      const tapGroups = analysis.groups.filter((_, g) => (mask >> g) & 1);
      const solved = start.slice();
      for (const i of tapGroups.flat()) solved[i] ^= 1;
      return { tapGroups, solved };
    });
  return { par: analysis.par, options };
}

/** The first fewest-taps solution that still has a safe order with this darkness, or null. */
function safeSolution(level, solutions) {
  const cells = buildCellIndex(level);
  const start = startOrientsOf(level);
  return solutions.options.find((option) => findSafeOrder(level, start, option.tapGroups, null, 0, cells)) ?? null;
}

function neighbours(level, cell) {
  const x = cell % level.width;
  const y = Math.floor(cell / level.width);
  return [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ]
    .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < level.width && ny < level.height)
    .map(([nx, ny]) => ny * level.width + nx);
}

/**
 * Voids where they cut off the cheaper routes: among empty cells whose zone leaves one fewest-taps solution and
 * every gem and lamp alone, try the ones that swallow the most of the starting light and keep the placement that
 * makes the level need the most taps (up to `maxPar`).
 */
function addVoids(level, count, maxPar) {
  let current = level;
  for (let n = 0; n < count; n++) {
    const solutions = cheapestSolutions(current);
    if (!solutions) return null;
    const { solved } = solutions.options[0];
    const keep = cellsOnBeams(traceBeams(current, solved).segments, current.width, current.height);
    const occupied = new Set(current.tiles.map((tile) => cellOf(current, tile)));
    const important = new Set(
      current.tiles.filter((tile) => [TILE.GEM, TILE.EMITTER, TILE.SWITCH, TILE.PORTAL].includes(tile.type)).map((tile) => cellOf(current, tile)),
    );
    const startLight = cellsOnBeams(traceBeams(current).segments, current.width, current.height);
    const candidates = [];
    for (let cell = 0; cell < current.width * current.height; cell++) {
      if (occupied.has(cell)) continue;
      const zone = [cell, ...neighbours(current, cell)];
      if (zone.some((c) => keep.has(c) || important.has(c))) continue;
      const score = zone.filter((c) => startLight.has(c)).length * 2 + zone.filter((c) => occupied.has(c)).length;
      if (score > 0) candidates.push({ cell, score });
    }
    candidates.sort((a, b) => b.score - a.score);
    let best = null;
    for (const { cell } of candidates.slice(0, 8)) {
      const tiles = [...current.tiles, { type: TILE.VOID, x: cell % current.width, y: Math.floor(cell / current.width) }];
      const tried = { ...current, tiles };
      const analysis = analyzeLevel(tried);
      if (!analysis.isSolvable || analysis.tooComplex || analysis.par > maxPar) continue;
      if (!best || analysis.par > best.par) best = { level: tried, par: analysis.par };
    }
    if (!best) return null;
    current = best.level;
  }
  return current;
}

/** A dying lamp: just enough reach for the solution, and power for the moves needed plus `spare`. */
function addPower(level, solution, par, spare) {
  // A fixed lamp if there is one, else a turning lamp (its light dims the same way).
  const fixed = level.tiles.findIndex((tile) => tile.type === TILE.EMITTER && !tile.turnable);
  const lamp = fixed >= 0 ? fixed : level.tiles.findIndex((tile) => tile.type === TILE.EMITTER);
  if (lamp < 0) return null;
  const cells = buildCellIndex(level);
  let reach = null;
  for (let range = 1; range <= level.width * level.height * 2; range++) {
    if (traceBeams(level, solution.solved, cells, { ranges: new Map([[lamp, range]]) }).isSolved) {
      reach = range;
      break;
    }
  }
  if (reach === null) return null;
  const tiles = level.tiles.map((tile, i) => (i === lamp ? { ...tile, reach, power: ticksAfter(level, par + spare) } : tile));
  return { ...level, tiles };
}

/** Fading gems with the tightest deadline that still has a safe order, plus `slack` ticks (gentler levels). */
function addFades(level, solution, count, slack, random) {
  const start = startOrientsOf(level);
  const cells = buildCellIndex(level);
  const litAtStart = traceBeams(level, start, cells).litGems;
  const gems = random.shuffle(level.tiles.flatMap((tile, i) => (tile.type === TILE.GEM && !litAtStart.has(i) ? [i] : [])));
  let current = level;
  for (const gem of gems.slice(0, count)) {
    let deadline = null;
    for (let fade = 1; fade <= ticksAfter(level, solution.tapGroups.length) + 1; fade++) {
      const tiles = current.tiles.map((tile, i) => (i === gem ? { ...tile, fade } : tile));
      if (findSafeOrder({ ...current, tiles }, start, solution.tapGroups, null, 0, cells)) {
        deadline = fade;
        break;
      }
    }
    if (deadline === null) return null;
    const fade = deadline + slack;
    current = { ...current, tiles: current.tiles.map((tile, i) => (i === gem ? { ...tile, fade } : tile)) };
  }
  return current;
}

/** Shortest routes over empty cells from each cell to beside a gem: parent links for following the way in. */
function routesTo(level, gem, blocked) {
  const target = cellOf(level, level.tiles[gem]);
  const parent = new Map();
  const distance = new Map();
  const queue = [];
  for (const cell of neighbours(level, target)) {
    if (blocked.has(cell)) continue;
    distance.set(cell, 1);
    parent.set(cell, null);
    queue.push(cell);
  }
  while (queue.length) {
    const cell = queue.shift();
    for (const next of neighbours(level, cell)) {
      if (blocked.has(next) || distance.has(next)) continue;
      distance.set(next, distance.get(cell) + 1);
      parent.set(next, cell);
      queue.push(next);
    }
  }
  return { parent, distance };
}

/**
 * Creeping shadows: for each, a gem and a start cell whose trail (over empty cells) makes the darkness matter.
 * With `targetRisk` (gentler levels) it looks for that share of random orders losing (0.12 when a shadow is first
 * met: far away, easy to burn; 0.4: a careless order often loses); without, the highest risk that still has a
 * safe order. `minLength` is the shortest trail allowed.
 */
function addGlooms(level, solution, count, targetRisk, random, minLength = 2) {
  const start = startOrientsOf(level);
  const cells = buildCellIndex(level);
  let current = level;
  const solvedLight = cellsOnBeams(traceBeams(level, solution.solved, cells).segments, level.width, level.height);
  const voidCells = new Set(
    level.tiles.filter((tile) => tile.type === TILE.VOID).flatMap((tile) => [cellOf(level, tile), ...neighbours(level, cellOf(level, tile))]),
  );
  for (let n = 0; n < count; n++) {
    const blocked = new Set([
      ...current.tiles.map((tile) => cellOf(current, tile)),
      ...voidCells,
      ...(current.glooms ?? []).flatMap((gloom) => gloom.trail),
    ]);
    const maxLength = ticksAfter(current, solution.tapGroups.length) + 3;
    const taken = new Set((current.glooms ?? []).map((gloom) => gloom.gem));
    // Each shadow heads for its own gem when there are enough, else two can close in on the same one.
    const allGems = current.tiles.flatMap((tile, i) => (tile.type === TILE.GEM ? [i] : []));
    const freeGems = allGems.filter((i) => !taken.has(i));
    const gems = random.shuffle(freeGems.length ? freeGems : allGems);
    let best = null;
    for (const gem of gems) {
      const { parent, distance } = routesTo(current, gem, blocked);
      // Trails that cross the finished light can always be burned in time by a careful player; try those first.
      const trailFrom = (startCell) => {
        const trail = [];
        for (let cell = startCell; cell !== null; cell = parent.get(cell)) trail.push(cell);
        return trail;
      };
      const reachable = random.shuffle([...distance.keys()].filter((cell) => distance.get(cell) >= minLength && distance.get(cell) <= maxLength));
      const crossing = reachable.filter((cell) => trailFrom(cell).some((c) => solvedLight.has(c)));
      const starts = [...crossing, ...reachable.filter((cell) => !crossing.includes(cell))].slice(0, 20);
      for (const startCell of starts) {
        const trail = trailFrom(startCell);
        const tried = { ...current, glooms: [...(current.glooms ?? []), { trail, gem }] };
        // A shadow that starts in the light would burn before the first tap.
        if (darknessStart(tried, start, cells).burned.has(tried.glooms.length - 1)) continue;
        if (!findSafeOrder(tried, start, solution.tapGroups, null, 0, cells)) continue;
        const risk = orderRisk(tried, start, solution.tapGroups, random, 24, cells);
        const score = targetRisk !== null ? -Math.abs(risk - targetRisk) : risk < 0.97 ? risk : -1;
        if (!best || score > best.score) best = { level: tried, score };
      }
      if (best && (targetRisk !== null ? best.score > -0.1 : best.score > 0.7)) break;
    }
    if (!best) return null;
    current = best.level;
  }
  return current;
}

/**
 * Add a darkness plan to a solved, generated level.
 * @param plan { voids, eclipse, power, fades, glooms, gentle, intro } (counts; eclipse is "every k moves", power 0/1;
 *   gentle and intro levels leave more room)
 * @returns the level with its darkness and (possibly higher) par, or null if this board can't take it
 */
export function addDarkness(level, plan, random, maxPar = 99) {
  let current = { width: level.width, height: level.height, tiles: level.tiles.map((tile) => ({ ...tile })) };
  if (plan.voids) {
    current = addVoids(current, plan.voids, maxPar);
    if (!current) return null;
  }
  if (plan.eclipse) current = { ...current, eclipse: plan.eclipse };
  const solutions = cheapestSolutions(current);
  if (!solutions || solutions.options.length === 0) return null;
  const { par } = solutions;
  const solution = solutions.options[0];
  if (plan.power) {
    current = addPower(current, solution, par, plan.intro ? 3 : plan.gentle ? 2 : 1);
    if (!current) return null;
  }
  if (plan.fades) {
    current = addFades(current, solution, plan.fades, plan.intro ? 2 : plan.gentle ? 1 : 0, random);
    if (!current) return null;
  }
  if (plan.glooms) {
    // A first shadow starts further away than the taps needed, so there's time to understand it.
    current = addGlooms(current, solution, plan.glooms, plan.intro ? 0.12 : plan.gentle ? 0.4 : null, random, plan.intro ? par + 1 : 2);
    if (!current) return null;
  }
  // The fewest taps must still win in some order with everything in place.
  if (!safeSolution(current, { par, options: [solution] })) return null;
  return { ...current, par };
}
