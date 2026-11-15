import { hashString } from '../lib/random.js';
import { nearestSolution } from './solver.js';
import { cellsOnBeams, traceBeams } from './beam.js';
import { DIFFICULTY } from './constants.js';
import { difficultyFor } from './worlds.js';

/*
 * Glowbugs: sleepy little critters hiding on some built-in levels (about 1 in 4, and every boss). One
 * sits on a cell the light passes through when the level is solved; it wakes up when a beam touches it,
 * and is rescued by solving the level with three stars. Rescues are worked out from the player's stars,
 * so the Glowbug Garden needs no extra saving or syncing.
 */
export const GLOWBUG_KINDS = [
  { id: 'firefly', name: 'Firefly', rare: false, bio: 'blinks hello in morse code (it only knows “hi”)' },
  { id: 'beetle', name: 'Beetle', rare: false, bio: 'polishes its shell every morning. Very shiny. Very proud' },
  { id: 'snail', name: 'Snail', rare: false, bio: 'is in no hurry at all, and that’s totally fine' },
  { id: 'sprout', name: 'Sprout', rare: false, bio: 'grows a tiny bit taller every time you smile' },
  { id: 'bunny', name: 'Bunlight', rare: false, bio: 'hops so high its ears glow like lanterns' },
  { id: 'shroom', name: 'Shroomlet', rare: false, bio: 'naps under its own cap. Built-in umbrella!' },
  { id: 'moth', name: 'Moth', rare: false, bio: 'loves lamps a little too much' },
  { id: 'jelly', name: 'Jelly', rare: false, bio: 'wobbles when it laughs, which is often' },
  { id: 'starling', name: 'Starling', rare: true, bio: 'fell from the sky and decided to stay' },
  { id: 'puff', name: 'Puff', rare: true, bio: 'is 90% fluff and 10% giggles' },
  { id: 'dragonling', name: 'Dragonling', rare: true, bio: 'breathes tiny warm sparkles instead of fire' },
  { id: 'comet', name: 'Comet', rare: true, bio: 'zooms around and leaves a trail of wishes' },
];

export const GLOWBUG_COLORS = [
  { id: 'peach', name: 'Peach', body: '#F2A67E', belly: '#FBD9C4', glow: '#FFD9B8' },
  { id: 'honey', name: 'Honey', body: '#F0C14E', belly: '#FBE6A8', glow: '#FFE38A' },
  { id: 'mint', name: 'Mint', body: '#7CC8B5', belly: '#CDEDE4', glow: '#BDEEE4' },
  { id: 'sage', name: 'Sage', body: '#86C08F', belly: '#D2EBD3', glow: '#CDEFC4' },
  { id: 'blossom', name: 'Blossom', body: '#EFA4A4', belly: '#FADADA', glow: '#FFD6DC' },
];

const FIRST_NAMES = [
  'Pip',
  'Dot',
  'Bean',
  'Zuzu',
  'Mo',
  'Tilly',
  'Nib',
  'Lulu',
  'Bo',
  'Fizz',
  'Wren',
  'Mimi',
  'Kip',
  'Juno',
  'Pebble',
  'Twig',
  'Nova',
  'Bibi',
  'Toffee',
  'Pom',
  'Sunny',
  'Lark',
  'Momo',
  'Tink',
  'Ollie',
  'Bree',
  'Jojo',
  'Fern',
  'Hazel',
  'Puddle',
  'Sprinkle',
  'Noodle',
  'Biscuit',
  'Wiggles',
  'Peanut',
  'Clover',
  'Daisy',
  'Gumdrop',
  'Button',
  'Marble',
  'Pudding',
  'Taffy',
  'Bubbles',
  'Cocoa',
  'Pickle',
  'Sesame',
  'Nugget',
  'Waffle',
  'Sprout',
  'Cricket',
  'Pixie',
  'Jellybean',
  'Muffin',
  'Trixie',
  'Bramble',
  'Zephyr',
  'Saffron',
  'Comet',
  'Aurora',
  'Starla',
];

/** All 60 species: every kind in every color, each with its own name and bio. */
export const GLOWBUGS = GLOWBUG_KINDS.flatMap((kind, k) =>
  GLOWBUG_COLORS.map((color, c) => {
    const name = FIRST_NAMES[k * GLOWBUG_COLORS.length + c];
    return {
      id: `${kind.id}-${color.id}`,
      kind: kind.id,
      color: color.id,
      name,
      title: `${color.name} ${kind.name}`,
      rare: kind.rare,
      bio: `${name} ${kind.bio}${/[.!?]$/.test(kind.bio) ? '' : '.'}`,
    };
  }),
);

export const glowbugById = (id) => GLOWBUGS.find((bug) => bug.id === id) ?? null;
const COMMON = GLOWBUGS.filter((bug) => !bug.rare);
const RARE = GLOWBUGS.filter((bug) => bug.rare);

/** The Glowbug on a built-in level, or null. Hard levels and bosses hide the rare kinds. */
export function glowbugForLevel(levelId) {
  const match = /^w(\d+)-(\d+)$/.exec(levelId);
  if (!match) return null;
  const index = Number(match[2]);
  if (match[1] === '1' && index <= 3) return null; // the tutorial stays simple
  const hash = hashString(`glowbug-${levelId}`);
  const difficulty = difficultyFor(index);
  if (difficulty !== DIFFICULTY.EXTRA && hash % 4 !== 1) return null;
  const pool = difficulty === DIFFICULTY.NORMAL ? COMMON : RARE;
  return pool[Math.floor(hash / 4) % pool.length];
}

/**
 * Where the Glowbug sleeps: an empty cell the light crosses in the level's solution (so solving it
 * always reaches the Glowbug), picked the same way every time; on the lamp if no such cell is free.
 */
export function glowbugCellOf(level) {
  const start = level.tiles.map((tile) => tile.orient ?? 0);
  const solution = nearestSolution(level, start);
  if (!solution) return null;
  const occupied = new Set(level.tiles.map((tile) => tile.y * level.width + tile.x));
  const cells = [...cellsOnBeams(traceBeams(level, solution).segments, level.width, level.height)].filter((cell) => !occupied.has(cell));
  if (cells.length) return cells.sort((a, b) => a - b)[hashString(`glowbug-cell-${level.id}`) % cells.length];
  // No free cell on the path (a few crowded boards): it snuggles on the lamp instead.
  const lamp = level.tiles.find((tile) => tile.type === 'emitter');
  return lamp ? lamp.y * level.width + lamp.x : null;
}

/** A Glowbug row is one kind in all 5 colors; rescuing the whole row pays this many diamonds (accounts), once. */
export const GLOWBUG_ROW_DIAMONDS = 1;

/** Kinds whose 5 colors are all rescued. */
export function completedGlowbugRows(levels) {
  const rescued = rescuedGlowbugs(levels);
  return GLOWBUG_KINDS.filter((kind) => GLOWBUGS.filter((bug) => bug.kind === kind.id).every((bug) => rescued.has(bug.id))).map((kind) => kind.id);
}

/** Rescued Glowbugs: every Glowbug level solved with three stars. @returns Map(speciesId -> times rescued) */
export function rescuedGlowbugs(levels) {
  const rescued = new Map();
  for (const [levelId, entry] of Object.entries(levels)) {
    if (entry.stars !== 3) continue;
    const bug = glowbugForLevel(levelId);
    if (bug) rescued.set(bug.id, (rescued.get(bug.id) ?? 0) + 1);
  }
  return rescued;
}
