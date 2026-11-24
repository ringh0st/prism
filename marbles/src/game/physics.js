// Marble physics on flat ground, seen from above. Pure and deterministic (fixed steps, no randomness), so the
// computer can try shots ahead of time and two phones playing each other see the same thing.
//
// A world: { w, h, marbles, stones, sand, hole, ring }.
//   marble: { id, x, y, vx, vy, r, m, kind, owner, out, sunk, air, roll }
//   stone:  { x, y, r }            a pebble that doesn't move
//   sand:   { x, y, r }            a soft patch that slows marbles down
//   hole:   { x, y, r } | null     the "mor": slow marbles drop in, fast ones skip over its lip
//   ring:   { x, y, r, shape } | null   the chalk ring: a circle, a triangle or a square (the rules use it)
//   puddles: [{ x, y, r }]          water: a marble that rolls in stops almost at once
//   terrain: [{ x, y, r, push }]    a mound (push > 0: marbles roll off it) or a dip (push < 0: they roll in)

export const STEP = 1 / 120;
const SAND_DRAG = 1500;
const PUDDLE_DRAG = 3600;

/**
 * The grounds a yard can have. Each rolls differently:
 *   drag   how fast it stops a rolling marble (px/s²)
 *   kerb   how much speed a marble keeps off the kerb
 *   slope  a downhill pull on a moving marble (px/s², toward the bottom of the yard)
 *   bumps  how much uneven ground bends a marble's way (px/s² sideways)
 *   hiss   how bright the rolling sound is (0 dull … 1 bright)
 */
export const GROUNDS = {
  earth: { id: 'earth', name: 'Packed earth', blurb: 'The classic yard', drag: 640, kerb: 0.5, slope: 0, bumps: 0, hiss: 0.5 },
  sand: { id: 'sand', name: 'Beach sand', blurb: 'Soft: marbles stop fast', drag: 1150, kerb: 0.25, slope: 0, bumps: 60, hiss: 0.2 },
  asphalt: { id: 'asphalt', name: 'Asphalt', blurb: 'Fast: they roll far and bounce', drag: 330, kerb: 0.78, slope: 0, bumps: 0, hiss: 1 },
  grass: { id: 'grass', name: 'Grass', blurb: 'Bumpy: shots curve', drag: 800, kerb: 0.35, slope: 0, bumps: 620, hiss: 0.1 },
  hill: { id: 'hill', name: 'The slope', blurb: 'Downhill: everything rolls back', drag: 600, kerb: 0.5, slope: 190, bumps: 0, hiss: 0.5 },
};
/** The challenges' yard: swept smooth, so marbles roll a little farther than on the playing grounds. */
export const SWEPT_EARTH = { ...GROUNDS.earth, drag: 440 };
const groundOf = (world) => world.ground ?? GROUNDS.earth;
/** Uneven ground: a slow, fixed pattern of dips and bumps over the yard (−1…1). */
const unevenAt = (x, y) => Math.sin(x * 0.019 + 1.3) * Math.cos(y * 0.011 + 0.7) + 0.35 * Math.sin((x + y) * 0.03);
const AIR_DRAG = 0.35; // 1/s
const REST_SPEED = 6;
const BOUNCE = { marble: 0.93, stone: 0.55 };
/** A marble crossing the hole faster than this skips over it. */
const HOLE_SKIP_SPEED = 540;

export const MARBLE_KINDS = {
  glass: { r: 13.5, m: 1 },
  // Shooters ("taws"): a normal one, a heavy steel one that plows through, and a big one that is easy to hit with.
  shooter: { r: 16, m: 1.3 },
  steelie: { r: 15, m: 2.8 },
  jumbo: { r: 19.5, m: 2.4 },
  // The same balanced shooter in the other looks children collect (owner: "the milky ones… one completely clear…").
  milky: { r: 16, m: 1.3, look: 'milky' },
  clear: { r: 16, m: 1.3, look: 'clear' },
  cateye: { r: 16, m: 1.3, look: 'cateye' },
  galaxy: { r: 16, m: 1.3, look: 'galaxy' },
};

/** The looks a glass marble comes in: swirl, milky (opaque white), clear, cat's eye (a colored blade inside), galaxy. */
export const LOOKS = ['swirl', 'milky', 'clear', 'cateye', 'galaxy'];

export function makeMarble(id, kind, x, y, owner = null) {
  return { id, kind, owner, x, y, vx: 0, vy: 0, ...MARBLE_KINDS[kind], out: false, sunk: false, air: 0, roll: 0 };
}

/** How much less true a harder flick flies: the widest it can stray to either side, in radians (power 0…1). */
export const strayOf = (power) => 0.014 + 0.085 * power * power;

/** The corners of a chalk ring that isn't a circle (null for a circle). */
export function ringCorners(ring) {
  if (ring.shape === 'triangle') {
    // It points sideways, so both players, shooting from the two ends, face the same shape.
    const R = ring.r * 1.06;
    return [
      { x: ring.x - R, y: ring.y },
      { x: ring.x + R / 2, y: ring.y - R * 0.866 },
      { x: ring.x + R / 2, y: ring.y + R * 0.866 },
    ];
  }
  if (ring.shape === 'square') {
    const half = ring.r * 0.9;
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => ({ x: ring.x + sx * half, y: ring.y + sy * half }));
  }
  return null;
}

/** How deep inside the ring a point lies (negative: that far outside), for a ring of any shape. */
export function depthInRing(ring, x, y) {
  const corners = ringCorners(ring);
  if (!corners) return ring.r - Math.hypot(x - ring.x, y - ring.y);
  let depth = Infinity;
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    // The corners go clockwise on screen, so the inside is on the right of each side.
    depth = Math.min(depth, ((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x)) / length);
  }
  return depth;
}

export const cloneWorld = (world) => ({ ...world, marbles: world.marbles.map((m) => ({ ...m })), stones: world.stones.map((s) => ({ ...s })) });

export const isLive = (m) => !m.sunk && !m.out;
export const speedOf = (m) => Math.hypot(m.vx, m.vy);
export const isAtRest = (world) => world.marbles.every((m) => !isLive(m) || (speedOf(m) === 0 && m.air <= 0));

/**
 * Flick a marble: angle in radians, power 0…1. A high shot ("bagova") flies over everything for the first part of
 * its way and lands with less speed.
 */
export function flick(marble, angle, power, { high = false, spin = 0 } = {}) {
  const speed = 170 + 730 * Math.max(0.05, Math.min(1, power));
  marble.vx = Math.cos(angle) * speed * (high ? 0.8 : 1);
  marble.vy = Math.sin(angle) * speed * (high ? 0.8 : 1);
  marble.air = high ? 0.38 : 0;
  marble.spin = spin;
}

/**
 * "Tinur" (owner: the finger flick that makes a marble spin, from her childhood): a spinning marble curves to
 * one side as it rolls, more as it slows, until it hits something (the spin goes into the knock). `spin` is -1
 * (curves left) or 1 (curves right) as the shooter sees it; CURVE is the sideways pull in units/s².
 */
export const CURVE = 520;

/** The yard's corners are rounded (owner: a marble got stuck in a square corner), with this radius. */
export const CORNER = 70;
/** A low lip along the kerb gently rolls a slow marble back off it, so none comes to rest against it. */
const LIP = { width: 20, push: 700 };

/**
 * One step of STEP seconds. Returns what happened, for sounds and rules:
 * [{ type: 'clack' | 'stone' | 'kerb' | 'sunk' | 'land', a, b?, force }]
 */
export function step(world) {
  const events = [];
  const ground = groundOf(world);
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
      const inWater = world.puddles?.some((s) => Math.hypot(m.x - s.x, m.y - s.y) < s.r);
      const next = v - ((inWater ? PUDDLE_DRAG : inSand ? SAND_DRAG : ground.drag) + AIR_DRAG * v) * STEP;
      const keep = next > REST_SPEED ? next / v : 0;
      m.vx *= keep;
      m.vy *= keep;
      if (keep > 0) {
        // Mounds and dips: a rolling marble is pushed down their slope, steepest half-way up.
        for (const t of world.terrain ?? []) {
          const dx = m.x - t.x;
          const dy = m.y - t.y;
          const d = Math.hypot(dx, dy);
          if (d >= t.r || d === 0) continue;
          const steep = Math.sin((d / t.r) * Math.PI) * t.push * STEP;
          m.vx += (dx / d) * steep;
          m.vy += (dy / d) * steep;
        }
        // Spin bends its way sideways (the faster it rolls, the less it bends).
        if (m.spin) {
          const side = (m.spin * CURVE * STEP) / Math.max(v, 60);
          const vx = m.vx;
          m.vx += -m.vy * side;
          m.vy += vx * side;
        }
        // The lip along the kerb rolls it back toward the yard.
        const edge = Math.min(m.x, world.w - m.x, m.y, world.h - m.y) - m.r;
        if (edge < LIP.width) {
          const toMiddleX = world.w / 2 - m.x;
          const toMiddleY = world.h / 2 - m.y;
          const d = Math.hypot(toMiddleX, toMiddleY) || 1;
          const lift = (1 - Math.max(0, edge) / LIP.width) * LIP.push * STEP;
          m.vx += (toMiddleX / d) * lift;
          m.vy += (toMiddleY / d) * lift;
        }
        // A slope pulls a rolling marble downhill; uneven ground bends its way sideways.
        m.vy += ground.slope * STEP;
        if (ground.bumps) {
          const push = (ground.bumps * unevenAt(m.x, m.y) * STEP) / v;
          const vx = m.vx;
          m.vx += -m.vy * push;
          m.vy += vx * push;
        }
      }
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
      a.spin = 0;
      b.spin = 0;
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
        m.spin = 0;
        m.vx -= (1 + BOUNCE.stone) * into * nx;
        m.vy -= (1 + BOUNCE.stone) * into * ny;
        events.push({ type: 'stone', a: m.id, force: -into });
      }
    }
    // The kerb round the yard, with rounded corners.
    for (const [axis, vel, low, high] of [['x', 'vx', m.r, world.w - m.r], ['y', 'vy', m.r, world.h - m.r]]) {
      if (m[axis] < low || m[axis] > high) {
        const force = Math.abs(m[vel]);
        m[axis] = m[axis] < low ? low : high;
        m[vel] = -m[vel] * ground.kerb;
        m.spin = 0;
        if (force > 40) events.push({ type: 'kerb', a: m.id, force });
      }
    }
    const cornerX = m.x < CORNER ? CORNER : m.x > world.w - CORNER ? world.w - CORNER : null;
    const cornerY = m.y < CORNER ? CORNER : m.y > world.h - CORNER ? world.h - CORNER : null;
    if (cornerX !== null && cornerY !== null) {
      const dx = m.x - cornerX;
      const dy = m.y - cornerY;
      const d = Math.hypot(dx, dy);
      if (d > CORNER - m.r) {
        const nx = dx / d;
        const ny = dy / d;
        m.x = cornerX + nx * (CORNER - m.r);
        m.y = cornerY + ny * (CORNER - m.r);
        const out = m.vx * nx + m.vy * ny;
        if (out > 0) {
          if (out > 40) events.push({ type: 'kerb', a: m.id, force: out });
          m.vx -= (1 + ground.kerb) * out * nx;
          m.vy -= (1 + ground.kerb) * out * ny;
          m.spin = 0;
        }
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
        const pull = 1500 * STEP;
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
