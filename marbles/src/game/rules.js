// The three classic games, each for two sides ('you' and 'foe'), and how a shot is judged.
//
// Ring ("ma'agal"): marbles lie in a chalk circle. Knock one out of the circle and it is yours.
// Hole ("mor"):     marbles lie round a small hole. Push one in and it is yours. Your own shooter in the hole is
//                   a foul: the turn ends and you give one marble back.
// Chase ("tzlifa"): each side has a shooter. Hit the other shooter to win a marble from their bag.
// In all three a good shot gives another turn, and a miss passes the turn (as in the old rules).
import { GROUNDS, cloneWorld, flick, isLive, makeMarble, settle } from './physics.js';

export const YARD = { w: 360, h: 560 };
export const MODES = {
  ring: { name: 'Ring', blurb: 'Knock their marbles out of the ring, not your own', toWin: 4 },
  hole: { name: 'Mor', blurb: 'Push marbles into the Mor, the little hole', toWin: 4 },
  chase: { name: 'Chase', blurb: 'Hit the other shooter', toWin: 3 },
};
export const SIDES = ['you', 'foe'];
export const HOME_SPOT = { you: { x: 180, y: 514 }, foe: { x: 180, y: 46 } };
export const other = (side) => (side === 'you' ? 'foe' : 'you');
const HOME = { you: { x: YARD.w / 2, y: YARD.h - 46 }, foe: { x: YARD.w / 2, y: 46 } };

/** A small random source with a seed, so both phones of a live game lay out the same yard. */
export function seeded(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A new game of a mode: the yard with its marbles laid out, both shooters at their lines. */
export function newGame(mode, { seed = 1, shooters = { you: 'shooter', foe: 'shooter' }, stones = mode === 'chase' ? 6 : 3, ground = 'earth' } = {}) {
  const rnd = seeded(seed);
  const cx = YARD.w / 2;
  const cy = YARD.h / 2;
  const world = { ...YARD, ground: GROUNDS[ground] ?? GROUNDS.earth, marbles: [], stones: [], sand: [], hole: null, ring: null };
  let id = 1;
  for (const side of SIDES) world.marbles.push(makeMarble(side, shooters[side], HOME[side].x, HOME[side].y, side));
  if (mode === 'chase') {
    // The chase starts with the shooters apart, not facing each other down the middle.
    const off = 60 + rnd() * 70;
    world.marbles[0].x += off;
    world.marbles[1].x -= off;
    world.sand.push({ x: cx + (rnd() - 0.5) * 120, y: cy + (rnd() - 0.5) * 120, r: 44 });
  }
  if (mode === 'ring') {
    world.ring = { x: cx, y: cy, r: 150 };
    // A cross of marbles in the middle, as children lay them out, with a few loose ones.
    // Each side puts six marbles in, mixed together: a shot has to pick the other side's out of the pack, because
    // knocking out one of your own gives it to them.
    const spots = [[31, 0], [-31, 0], [0, 31], [0, -31], [62, 0], [-62, 0], [0, 62], [0, -62], [39, 39], [-39, 39], [39, -39], [-39, -39]];
    const teams = spots.map((_, i) => (i % 2 ? 'you' : 'foe'));
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }
    spots.forEach(([dx, dy], i) => {
      const marble = makeMarble(`t${id++}`, 'glass', cx + dx + (rnd() - 0.5) * 6, cy + dy + (rnd() - 0.5) * 6);
      marble.team = teams[i];
      world.marbles.push(marble);
    });
  } else if (mode === 'hole') {
    world.hole = { x: cx, y: cy, r: 28 };
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + rnd() * 0.5;
      const far = 70 + rnd() * 50;
      world.marbles.push(makeMarble(`t${id++}`, 'glass', cx + Math.cos(angle) * far, cy + Math.sin(angle) * far));
    }
  }
  // Pebbles lie about the yard, never on a marble or right at a shooting line.
  for (let tries = 0; world.stones.length < stones && tries < 200; tries++) {
    const stone = { x: 40 + rnd() * (YARD.w - 80), y: 110 + rnd() * (YARD.h - 220), r: 9 + rnd() * 6 };
    const isClear = world.marbles.every((m) => Math.hypot(m.x - stone.x, m.y - stone.y) > m.r + stone.r + 18) && world.stones.every((s) => Math.hypot(s.x - stone.x, s.y - stone.y) > 50);
    const onTarget = (world.hole && Math.hypot(world.hole.x - stone.x, world.hole.y - stone.y) < 60) || (world.ring && Math.hypot(world.ring.x - stone.x, world.ring.y - stone.y) < world.ring.r + 10);
    if (isClear && !onTarget) world.stones.push(stone);
  }
  return {
    mode,
    world,
    // Who shoots first is drawn, as children do with a toss.
    turn: rnd() < 0.5 ? 'you' : 'foe',
    bag: { you: 0, foe: 0 },
    // Each side may call each of these once a game.
    calls: { you: { bakol: 1, bagova: 1 }, foe: { bakol: 1, bagova: 1 } },
    // Ring: whether each shooter lies inside the ring (a shooter knocked out of it costs its side a marble).
    inRing: { you: false, foe: false },
    winner: null,
    shots: 0,
    last: null,
  };
}

/** "Bakol!": the pebbles are swept off the yard. */
export function callBakol(game, side) {
  if (game.calls[side].bakol < 1 || !game.world.stones.length) return false;
  game.calls[side].bakol--;
  game.world.stones = [];
  return true;
}

const targetsLeft = (world) => world.marbles.filter((m) => !m.owner && isLive(m));

/**
 * The shot of the side whose turn it is: flicks its shooter, lets everything come to rest and applies the rules.
 * Changes `game` and returns what happened: { events, won, foul, again, hits } (`events` are the physics events
 * with their times, for sounds; pass `onStep` to watch the marbles move).
 */
export function shoot(game, angle, power, { high = false, onStep = null } = {}) {
  const side = game.turn;
  const { world, mode } = game;
  const shooter = world.marbles.find((m) => m.id === side);
  if (high) game.calls[side].bagova--;
  flick(shooter, angle, power, { high });
  const events = settle(world, 12, onStep);
  return judge(game, side, events);
}

/** Applies the rules to a yard that has come to rest after `side` shot. */
export function judge(game, side, events) {
  const { world, mode } = game;
  const shooter = world.marbles.find((m) => m.id === side);
  const foeShooter = world.marbles.find((m) => m.id === other(side));
  let won = 0;
  let foul = null;
  let knocked = false;
  let lost = 0;
  if (mode === 'ring') {
    for (const m of targetsLeft(world)) {
      if (Math.hypot(m.x - world.ring.x, m.y - world.ring.y) > world.ring.r + m.r * 0.2) {
        m.out = true;
        // One of your own knocked out goes to the other side.
        if (m.team === side) lost++;
        else won++;
      }
    }
    // A shooter left inside the ring is fair game: knock it out and you take one of its side's marbles.
    const lies = (s) => Boolean(s) && Math.hypot(s.x - world.ring.x, s.y - world.ring.y) < world.ring.r;
    if (foeShooter && game.inRing?.[other(side)] && !lies(foeShooter)) {
      if (game.bag[other(side)] > 0) {
        game.bag[other(side)]--;
        won++;
      }
      Object.assign(foeShooter, { x: HOME[other(side)].x, y: HOME[other(side)].y, vx: 0, vy: 0 });
      knocked = true;
    }
    // Every shot is taken from the line: after a good shot the shooter is picked up, and so is one that missed and
    // rolled clear. One that missed and stopped inside the ring stays there until its side's next turn, where the
    // other side can knock it out.
    const sendHome = (who, s) => Object.assign(s, { x: HOME[who].x, y: HOME[who].y, vx: 0, vy: 0 });
    if (!game.challenge) {
      if (won > 0 || lost > 0 || !lies(shooter)) sendHome(side, shooter);
      if (won === 0 && foeShooter && lies(foeShooter)) sendHome(other(side), foeShooter);
    }
    if (game.inRing) game.inRing = { [side]: lies(shooter), [other(side)]: lies(foeShooter) };
  } else if (mode === 'hole') {
    for (const m of world.marbles) {
      if (!m.owner && m.sunk && !m.counted) {
        m.counted = true;
        won++;
      }
    }
    for (const who of SIDES) {
      const s = world.marbles.find((m) => m.id === who);
      if (!s?.sunk) continue;
      // A shooter in the hole comes back to its line; the side that sent it there gives a marble back.
      Object.assign(s, { sunk: false, x: HOME[who].x, y: HOME[who].y, vx: 0, vy: 0 });
      if (who === side) foul = 'mor';
    }
    if (foul && game.bag[side] > 0 && won === 0) game.bag[side]--;
  } else if (mode === 'chase') {
    const hit = events.some((e) => e.type === 'clack' && [e.a, e.b].includes(side) && [e.a, e.b].includes(other(side)));
    // A wild shot that sends your own shooter into the kerb without a hit is "out": the other side takes a marble.
    if (!hit && !game.challenge && events.some((e) => e.type === 'kerb' && e.a === side)) {
      foul = 'out';
      game.bag[other(side)]++;
    }
    if (hit) {
      won = 1;
      // The shooter that was hit goes back to its line, as when a child picks it up to start again.
      if (!game.challenge) {
        // The shooter that was hit is put down again far from the hitter: on the other half, at a spot the number
        // of shots so far decides (so both phones of a live game agree).
        const spot = seeded(game.shots * 7919 + 13);
        const farY = shooter.y > world.h / 2 ? 46 + spot() * 120 : world.h - 46 - spot() * 120;
        Object.assign(foeShooter, { x: 40 + spot() * (world.w - 80), y: farY, vx: 0, vy: 0 });
      }
    }
  }
  game.bag[side] += won;
  game.bag[other(side)] += lost;
  game.shots++;
  const again = won > 0 && lost === 0 && !foul;
  if (game.challenge) {
    // A challenge is played alone: enough marbles won is a win, the last shot used without it a loss.
    game.turn = 'you';
    if (game.bag.you >= game.challenge.need) game.winner = 'you';
    else if (game.shots >= game.challenge.shots) game.winner = 'foe';
    game.last = { side, won, lost, foul, again: false };
    return { events, won, lost, foul, again: false, hits: events.filter((e) => e.type === 'clack').length };
  }
  if (game.bag[side] >= MODES[mode].toWin) game.winner = side;
  else if (!game.challenge && game.bag[other(side)] >= MODES[mode].toWin) game.winner = other(side);
  else if (mode !== 'chase' && targetsLeft(world).length === 0) game.winner = game.bag.you === game.bag.foe ? side : game.bag.you > game.bag.foe ? 'you' : 'foe';
  if (!again && !game.winner) game.turn = other(side);
  game.last = { side, won, lost, foul, again, knocked };
  return { events, won, lost, foul, again, knocked, hits: events.filter((e) => e.type === 'clack').length };
}

/** What a shot would do, without touching the game (the computer and the tests use it). */
export function tryShot(game, angle, power, options = {}) {
  const copy = { ...game, world: cloneWorld(game.world), bag: { ...game.bag }, calls: { you: { ...game.calls.you }, foe: { ...game.calls.foe } } };
  copy.world.marbles = copy.world.marbles.map((m) => ({ ...m }));
  const result = shoot(copy, angle, power, options);
  return { ...result, game: copy };
}
