// Marble physics on flat ground, seen from above. Pure and deterministic (fixed steps, no randomness), so the
// computer can try shots ahead of time and two phones playing each other see the same thing.
//
// A world: { w, h, marbles, stones, sand, hole, ring }.
//   marble: { id, x, y, vx, vy, r, m, kind, owner, out, sunk, air, roll }
//   stone:  { x, y, r }            a pebble that doesn't move
//   sand:   { x, y, r }            a soft patch that slows marbles down
//   hole:   { x, y, r } | null     the "mor": slow marbles drop in, fast ones skip over its lip
//   ring:   { x, y, r } | null     the chalk circle (the rules use it; physics doesn't)

export const STEP = 1 / 120;
const GROUND_DRAG = 420; // px/s²: how fast packed earth stops a rolling marble
const SAND_DRAG = 1500;
const AIR_DRAG = 0.35; // 1/s
const REST_SPEED = 6;
const BOUNCE = { marble: 0.93, stone: 0.55, kerb: 0.5 };
/** A marble crossing the hole faster than this skips over it. */
const HOLE_SKIP_SPEED = 430;

export const MARBLE_KINDS = {
  glass: { r: 11, m: 1 },
  // Shooters ("taws"): a normal one, a heavy steel one that plows through, and a big one that is easy to hit with.
  shooter: { r: 13, m: 1.5 },
  steelie: { r: 12, m: 2.6 },
  jumbo: { r: 16, m: 2.2 },
};

export function makeMarble(id, kind, x, y, owner = null) {
  return { id, kind, owner, x, y, vx: 0, vy: 0, ...MARBLE_KINDS[kind], out: false, sunk: false, air: 0, roll: 0 };
}

export const cloneWorld = (world) => ({ ...world, marbles: world.marbles.map((m) => ({ ...m })), stones: world.stones.map((s) => ({ ...s })) });

export const isLive = (m) => !m.sunk && !m.out;
export const speedOf = (m) => Math.hypot(m.vx, m.vy);
export const isAtRest = (world) => world.marbles.every((m) => !isLive(m) || (speedOf(m) === 0 && m.air <= 0));

/**
 * Flick a marble: angle in radians, power 0…1. A high shot ("bagova") flies over everything for the first part of
 * its way and lands with less speed.
 */
export function flick(marble, angle, power, { high = false } = {}) {
  const speed = 180 + 780 * Math.max(0.05, Math.min(1, power));
  marble.vx = Math.cos(angle) * speed * (high ? 0.8 : 1);
  marble.vy = Math.sin(angle) * speed * (high ? 0.8 : 1);
  marble.air = high ? 0.38 : 0;
}

/**
 * One step of STEP seconds. Returns what happened, for sounds and rules:
 * [{ type: 'clack' | 'stone' | 'kerb' | 'sunk' | 'land', a, b?, force }]
 */
export function step(world) {
  const events = [];
  const live = world.marbles.filter(isLive);
  for (const m of live) {
    const v = speedOf(m);
    if (m.air > 0) {
      // In the air: nothing slows it and nothing is in its way.
      m.air -= STEP;
      if (m.air <= 0) {
        m.vx *= 0.55;
        m.vy *= 0.55;
        events.push({ type: 'land', a: m.id, force: v });
      }
    } else if (v > 0) {
      const inSand = world.sand.some((s) => Math.hypot(m.x - s.x, m.y - s.y) < s.r);
      const next = v - ((inSand ? SAND_DRAG : GROUND_DRAG) + AIR_DRAG * v) * STEP;
      const keep = next > REST_SPEED ? next / v : 0;
      m.vx *= keep;
      m.vy *= keep;
    }
    m.x += m.vx * STEP;
    m.y += m.vy * STEP;
    m.roll += v * STEP;
  }

  // Marble against marble.
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i];
      const b = live[j];
      if (a.air > 0 || b.air > 0) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      const reach = a.r + b.r;
      if (d >= reach || d === 0) continue;
      const nx = dx / d;
      const ny = dy / d;
      // Push them apart by their weights, then bounce along the line between their centers.
      const overlap = reach - d;
      const total = a.m + b.m;
      a.x -= nx * overlap * (b.m / total);
      a.y -= ny * overlap * (b.m / total);
      b.x += nx * overlap * (a.m / total);
      b.y += ny * overlap * (a.m / total);
      const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (closing <= 0) continue;
      const impulse = ((1 + BOUNCE.marble) * closing) / (1 / a.m + 1 / b.m);
      a.vx -= (impulse / a.m) * nx;
      a.vy -= (impulse / a.m) * ny;
      b.vx += (impulse / b.m) * nx;
      b.vy += (impulse / b.m) * ny;
      events.push({ type: 'clack', a: a.id, b: b.id, force: closing });
    }
  }

  for (const m of live) {
    if (m.air > 0) continue;
    // Pebbles.
    for (const s of world.stones) {
      const dx = m.x - s.x;
      const dy = m.y - s.y;
      const d = Math.hypot(dx, dy);
      const reach = m.r + s.r;
      if (d >= reach || d === 0) continue;
      const nx = dx / d;
      const ny = dy / d;
      m.x = s.x + nx * reach;
      m.y = s.y + ny * reach;
      const into = m.vx * nx + m.vy * ny;
      if (into < 0) {
        m.vx -= (1 + BOUNCE.stone) * into * nx;
        m.vy -= (1 + BOUNCE.stone) * into * ny;
        events.push({ type: 'stone', a: m.id, force: -into });
      }
    }
    // The kerb round the yard.
    for (const [axis, vel, low, high] of [['x', 'vx', m.r, world.w - m.r], ['y', 'vy', m.r, world.h - m.r]]) {
      if (m[axis] < low || m[axis] > high) {
        const force = Math.abs(m[vel]);
        m[axis] = m[axis] < low ? low : high;
        m[vel] = -m[vel] * BOUNCE.kerb;
        if (force > 40) events.push({ type: 'kerb', a: m.id, force });
      }
    }
    // The hole: a slow marble drops in, a fast one skips over, one that passes close is pulled a little.
    const hole = world.hole;
    if (hole) {
      const dx = hole.x - m.x;
      const dy = hole.y - m.y;
      const d = Math.hypot(dx, dy);
      const v = speedOf(m);
      if (d < hole.r - m.r * 0.35 && v < HOLE_SKIP_SPEED) {
        m.sunk = true;
        m.vx = m.vy = 0;
        events.push({ type: 'sunk', a: m.id, force: v });
      } else if (d < hole.r + m.r && d > 0 && v > 0) {
        const pull = 900 * STEP;
        m.vx += (dx / d) * pull;
        m.vy += (dy / d) * pull;
      }
    }
  }
  return events;
}

/** Runs the world until every marble lies still (or `maxSeconds` pass). Returns all events, each with its time. */
export function settle(world, maxSeconds = 12, onStep = null) {
  const events = [];
  let t = 0;
  while (t < maxSeconds && !isAtRest(world)) {
    for (const event of step(world)) events.push({ ...event, t });
    t += STEP;
    onStep?.(world, t);
  }
  // Whatever still creeps after the limit stops, so a turn always ends.
  for (const m of world.marbles) m.vx = m.vy = 0;
  return events;
}
