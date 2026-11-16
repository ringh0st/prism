import { TILE } from './constants.js';

/*
 * The pieces a player meets along the way. The first level that has a piece they've never seen
 * introduces it with a spotlight on the board: its name and a few words. Order = the order they're shown in.
 */
export const PIECES = [
  {
    id: 'basics',
    name: 'Mirrors and gems',
    text: 'Tap a mirror to turn it. Light every gem!',
    sample: { type: TILE.MIRROR, orient: 0 },
  },
  {
    id: 'wall',
    name: 'Walls',
    text: 'Walls stop the light.',
    sample: { type: TILE.WALL },
  },
  {
    id: 'locked',
    name: 'Fixed mirrors',
    text: 'Bolted mirrors can’t turn.',
    sample: { type: TILE.MIRROR, orient: 1, locked: true },
  },
  {
    id: 'splitter',
    name: 'Splitters',
    text: 'One beam in, two beams out.',
    sample: { type: TILE.SPLITTER, orient: 0 },
  },
  {
    id: 'color',
    name: 'Color glass',
    text: 'Glass paints the light. Match each gem’s color.',
    sample: { type: TILE.FILTER, color: 'lime' },
  },
  {
    id: 'shade',
    name: 'Shadow crystals',
    text: 'Keep the light off this one!',
    sample: { type: TILE.SHADE },
  },
  {
    id: 'twins',
    name: 'Twin mirrors',
    text: 'Same mark? They turn together.',
    sample: { type: TILE.MIRROR, orient: 0, link: 'a' },
  },
  {
    id: 'portal',
    name: 'Portals',
    text: 'Light jumps to the matching portal.',
    sample: { type: TILE.PORTAL, pair: 'a' },
  },
  {
    id: 'fragile',
    name: 'Cracking mirrors',
    text: 'Only 3 turns, then it’s stuck.',
    sample: { type: TILE.MIRROR, orient: 0, fragile: true },
  },
  {
    id: 'fog',
    name: 'Fog',
    text: 'Something hides here. Shine light on it!',
    sample: { type: TILE.GEM, color: 'sun', fog: true },
  },
  {
    id: 'prism',
    name: 'Prism crystals',
    text: 'Splits the light both ways. Can’t turn.',
    sample: { type: TILE.PRISM },
  },
  {
    id: 'gate',
    name: 'Light gates',
    text: 'Light the switch to open the gate.',
    sample: { type: TILE.GATE, pair: 'a' },
  },
  {
    id: 'lamp',
    name: 'Turning lamps',
    text: 'Tap the lamp to turn it.',
    sample: { type: TILE.EMITTER, dir: 'right', color: 'sun', turnable: true },
  },
  {
    id: 'oneSided',
    name: 'One-sided mirrors',
    text: 'Shiny side bounces. The back blocks.',
    sample: { type: TILE.MIRROR, orient: 0, oneSided: 0 },
  },
];

const HAS = {
  basics: () => true,
  wall: (tile) => tile.type === TILE.WALL,
  locked: (tile) => tile.type === TILE.MIRROR && tile.locked,
  splitter: (tile) => tile.type === TILE.SPLITTER,
  color: (tile) => tile.type === TILE.FILTER || (tile.type === TILE.GEM && tile.color && tile.color !== 'sun'),
  shade: (tile) => tile.type === TILE.SHADE,
  twins: (tile) => Boolean(tile.link),
  portal: (tile) => tile.type === TILE.PORTAL,
  fragile: (tile) => Boolean(tile.fragile),
  fog: (tile) => Boolean(tile.fog),
  prism: (tile) => tile.type === TILE.PRISM,
  gate: (tile) => tile.type === TILE.GATE,
  lamp: (tile) => tile.type === TILE.EMITTER && Boolean(tile.turnable),
  oneSided: (tile) => tile.oneSided !== undefined,
};

/** Where each piece is first taught (levels are built so each one brings at most one new piece). */
export const PIECE_FIRST_LEVEL = {
  basics: 'w1-01',
  wall: 'w1-04',
  locked: 'w1-10',
  splitter: 'w2-01',
  color: 'w3-01',
  shade: 'w4-01',
  twins: 'w5-01',
  portal: 'w6-01',
  fragile: 'w7-01',
  fog: 'w8-01',
  prism: 'w9-01',
  gate: 'w10-01',
  lamp: 'w11-01',
  oneSided: 'w12-01',
};

/**
 * The piece to introduce in this level, if any: the first one, in teaching order, the player hasn't met.
 * Never more than one per level, so pieces arrive gradually.
 */
export function newPiecesIn(level, seenIds) {
  return PIECES.filter((piece) => !seenIds.includes(piece.id) && piecesIn(level).includes(piece.id)).slice(0, 1);
}

/** Every kind of piece a level uses, in teaching order. */
export const piecesIn = (level) => PIECES.filter((piece) => level.tiles.some(HAS[piece.id])).map((piece) => piece.id);

/** Pieces a player has already met: those whose first level they've solved (for players from before the cards). */
export const piecesMetIn = (solvedLevels) => PIECES.filter((piece) => solvedLevels[PIECE_FIRST_LEVEL[piece.id]]).map((piece) => piece.id);

/** The first tile of a piece in a level (to point at it on the board), or -1. */
export function firstTileOf(level, pieceId) {
  if (pieceId === 'basics') return level.tiles.findIndex((tile) => tile.type === TILE.MIRROR && !tile.locked);
  return level.tiles.findIndex(HAS[pieceId]);
}
