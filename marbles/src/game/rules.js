// The three classic games, each for two sides ('you' and 'foe'), and how a shot is judged.
//
// Ring ("ma'agal"): marbles lie in a chalk circle. Knock one out of the circle and it is yours.
// Hole ("mor"):     marbles lie round a small hole. Push one in and it is yours. Your own shooter in the hole is
//                   a foul: the turn ends and you give one marble back.
// Chase ("tzlifa"): each side has a shooter. Hit the other shooter to win a marble from their bag.
// In all three a good shot gives another turn, and a miss passes the turn (as in the old rules).
import { GROUNDS, cloneWorld, depthInRing, flick, isLive, makeMarble, settle } from './physics.js';

export const YARD = { w: 360, h: 560 };
export const MODES = {
  ring: { name: 'Ring', blurb: 'Knock their marbles out of the ring, not your own', toWin: 4 },
  hole: { name: 'Mor', blurb: 'Push marbles into the Mor, the little hole', toWin: 4 },
  chase: { name: 'Chase', blurb: 'Hit the other shooter', toWin: 3 },
};
export const SIDES = ['you', 'foe'];
/** How many extra shots a turn can earn: win a marble and shoot once more, then the turn passes anyway. */
export const BONUS_SHOTS = 1;
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

/**
 * A new game of a mode: the yard with its marbles laid out, both shooters at their lines.
 * @param terrain lay out the yard's own shape (a mound, a dip, a puddle or gates) and draw the ring as a circle,
 *   a triangle or a square, all from the seed: no two yards are alike. False for a plain flat yard with a circle.
 */
export function newGame(mode, { seed = 1, shooters = { you: 'shooter', foe: 'shooter' }, stones = mode === 'chase' ? 6 : 3, ground = 'earth', terrain = true } = {}) {
  const rnd = seeded(seed);
  const cx = YARD.w / 2;
  const cy = YARD.h / 2;
  const world = { ...YARD, ground: GROUNDS[ground] ?? GROUNDS.earth, marbles: [], stones: [], sand: [], puddles: [], terrain: [], features: [], hole: null, ring: null };
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
    // Sometimes the ring isn't a circle (as children drew it): a triangle or a square, about as roomy.
    const shape = terrain ? ['circle', 'circle', 'triangle', 'square'][Math.floor(rnd() * 4)] : 'circle';
    world.ring = { x: cx, y: cy, r: 150, shape };
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
  if (terrain) {
    // The yard's own shape: one or two of a mound, a dip, a puddle and a pair of gates, the same for both sides.
    const kinds = ['mound', 'dip', 'puddle', 'gates'];
    for (let i = kinds.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
    }
    const spot = () => {
      for (let tries = 0; tries < 40; tries++) {
        const at = { x: 70 + rnd() * (YARD.w - 140), y: 150 + rnd() * (YARD.h - 300) };
        if (!world.hole || Math.hypot(world.hole.x - at.x, world.hole.y - at.y) > 95) return at;
      }
      return { x: 80, y: 180 };
    };
    for (const kind of kinds.slice(0, rnd() < 0.5 ? 1 : 2)) {
      world.features.push(kind);
      if (kind === 'mound') world.terrain.push({ ...spot(), r: 58, push: 1500 });
      else if (kind === 'dip') world.terrain.push({ ...spot(), r: 54, push: -1300 });
      else if (kind === 'puddle') world.puddles.push({ ...spot(), r: 30 });
      else for (const y of [YARD.h - 118, 118]) for (const dx of [-30, 30]) world.stones.push({ x: cx + dx, y, r: 8, post: true });
    }
  }
  // Pebbles lie about the yard, never on a marble or right at a shooting line.
  const posts = world.stones.length;
  for (let tries = 0; world.stones.length < stones + posts && tries < 200; tries++) {
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
    // Fair turns: both sides always get the same number of turns (see endTurn), and a turn is at most 1 + BONUS_SHOTS shots.
    turns: { you: 0, foe: 0 },
    run: 0,
    winner: null,
    shots: 0,
    last: null,
  };
}

/** "Bakol!": the pebbles are swept off the yard. */
export function callBakol(game, side) {
  if (game.calls[side].bakol < 1 || !game.world.stones.some((stone) => !stone.post)) return false;
  game.calls[side].bakol--;
  game.world.stones = game.world.stones.filter((stone) => stone.post);
  return true;
}

const targetsLeft = (world) => world.marbles.filter((m) => !m.owner && isLive(m));

/**
 * The marbles a side is after right now, so the yard can mark them (owner: "how can I know which color I need?
 * It should be in the board game"): in the Ring the other side's marbles, in the Mor every marble, in the Chase
 * the other shooter.
 */
export function aimsOf(game, side) {
  const { world, mode } = game;
  if (mode === 'chase') return world.marbles.filter((m) => m.owner && m.id !== side && isLive(m));
  if (mode === 'ring') return targetsLeft(world).filter((m) => m.team && m.team !== side);
  return targetsLeft(world);
}

/**
 * The shot of the side whose turn it is: flicks its shooter, lets everything come to rest and applies the rules.
 * Changes `game` and returns what happened: { events, won, foul, again, hits } (`events` are the physics events
 * with their times, for sounds; pass `onStep` to watch the marbles move).
 */
export function shoot(game, angle, power, { high = false, onStep = null } = {}) {
  const side = game.turn;
  const { world } = game;
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
      if (depthInRing(world.ring, m.x, m.y) < -m.r * 0.2) {
        m.out = true;
        // One of your own knocked out goes to the other side.
        if (m.team === side) lost++;
        else won++;
      }
    }
    // A shooter left inside the ring is fair game: knock it out and you take one of its side's marbles.
    const lies = (s) => Boolean(s) && depthInRing(world.ring, s.x, s.y) > 0;
    if (foeShooter && game.inRing?.[other(side)] && !lies(foeShooter)) {
      if (game.bag[other(side)] > 0) {
        game.bag[other(side)]--;
        won++;
      }
      Object.assign(foeShooter, { x: HOME[other(side)].x, y: HOME[other(side)].y, vx: 0, vy: 0 });
      knocked = true;
    }
    // A shooter stays where it stopped and the next shot is taken from there (owner: sent back to the line every
    // time, nobody could score at all on the slow grounds). One left inside the ring can be knocked out.
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
      if (!game.challenge) Object.assign(foeShooter, { x: HOME[other(side)].x, y: HOME[other(side)].y, vx: 0, vy: 0 });
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
  // A good shot earns one more, not a run of them; reaching the target ends the turn too.
  const keeps = again && game.run < BONUS_SHOTS && game.bag[side] < MODES[mode].toWin;
  if (keeps) game.run++;
  else endTurn(game);
  game.last = { side, won, lost, foul, again: keeps, knocked };
  return { events, won, lost, foul, again: keeps, knocked, hits: events.filter((e) => e.type === 'clack').length };
}

/**
 * The turn of the side now shooting is over (it missed, used its bonus shot, or ran out of time). The game is
 * only decided when both sides have had the same number of turns, so shooting first is no advantage: if the
 * first side reaches the target, the other still gets its turn to answer. Level at the end of a round, they play
 * on until one leads. `winner` becomes 'you', 'foe' or 'draw' (nothing left to shoot at and the bags are level).
 */
export function endTurn(game) {
  const side = game.turn;
  const { mode, world, bag } = game;
  game.turns[side]++;
  game.run = 0;
  const leader = bag.you === bag.foe ? null : bag.you > bag.foe ? 'you' : 'foe';
  const isRoundOver = game.turns.you === game.turns.foe;
  const isEmpty = mode !== 'chase' && targetsLeft(world).length === 0;
  if (isEmpty) game.winner = leader ?? 'draw';
  else if (isRoundOver && leader && bag[leader] >= MODES[mode].toWin) game.winner = leader;
  if (!game.winner) game.turn = other(side);
}

/** What a shot would do, without touching the game (the computer and the tests use it). */
export function tryShot(game, angle, power, options = {}) {
  const copy = { ...game, world: cloneWorld(game.world), bag: { ...game.bag }, turns: { ...game.turns }, calls: { you: { ...game.calls.you }, foe: { ...game.calls.foe } } };
  copy.world.marbles = copy.world.marbles.map((m) => ({ ...m }));
  const result = shoot(copy, angle, power, options);
  return { ...result, game: copy };
}
