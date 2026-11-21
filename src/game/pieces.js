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
  // The darkness (darkness.js): Smudge's pieces race the player move by move.
  {
    id: 'gloom',
    name: 'Creeping shadows',
    text: 'It creeps to a gem each move. Light burns it!',
    sample: { type: 'gloom' },
  },
  {
    id: 'fade',
    name: 'Fading gems',
    text: 'Light it before the number runs out.',
    sample: { type: TILE.GEM, color: 'sun', fade: 3 },
  },
  {
    id: 'power',
    name: 'Dying lamps',
    text: 'Each move, the light reaches less far.',
    sample: { type: TILE.EMITTER, dir: 'right', color: 'sun', power: 3, reach: 4 },
  },
  {
    id: 'void',
    name: 'Voids',
    text: 'Light that passes next to it is swallowed.',
    sample: { type: TILE.VOID },
  },
  {
    id: 'eclipse',
    name: 'Eclipses',
    text: 'Every 3rd move, the darkness moves twice.',
    sample: { type: 'eclipse' },
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
  fade: (tile) => Boolean(tile.fade),
  power: (tile) => tile.power !== undefined,
  void: (tile) => tile.type === TILE.VOID,
};

/** Pieces that belong to the whole level rather than a tile. */
const LEVEL_HAS = {
  gloom: (level) => Boolean(level.glooms?.length),
  eclipse: (level) => Boolean(level.eclipse),
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
  gloom: 'w13-01',
  fade: 'w14-01',
  power: 'w15-01',
  void: 'w16-01',
  eclipse: 'w17-01',
};

/**
 * The piece to introduce in this level, if any: the first one, in teaching order, the player hasn't met.
 * Never more than one per level, so pieces arrive gradually.
 */
export function newPiecesIn(level, seenIds) {
  return PIECES.filter((piece) => !seenIds.includes(piece.id) && piecesIn(level).includes(piece.id)).slice(0, 1);
}

/** Every kind of piece a level uses, in teaching order. */
export const piecesIn = (level) =>
  PIECES.filter((piece) => (LEVEL_HAS[piece.id] ? LEVEL_HAS[piece.id](level) : level.tiles.some(HAS[piece.id]))).map((piece) => piece.id);

/** Pieces a player has already met: those whose first level they've solved (for players from before the cards). */
export const piecesMetIn = (solvedLevels) => PIECES.filter((piece) => solvedLevels[PIECE_FIRST_LEVEL[piece.id]]).map((piece) => piece.id);

/** The first tile of a piece in a level (to point at it on the board), or -1 (also for level-wide pieces). */
export function firstTileOf(level, pieceId) {
  if (pieceId === 'basics') return level.tiles.findIndex((tile) => tile.type === TILE.MIRROR && !tile.locked);
  if (!HAS[pieceId]) return -1;
  return level.tiles.findIndex(HAS[pieceId]);
}

/** The board cell to point at when teaching a piece: its first tile, where a shadow starts, or null (the whole board). */
export function pieceCellOf(level, pieceId) {
  if (pieceId === 'gloom') return level.glooms?.[0]?.trail[0] ?? null;
  const tile = level.tiles[firstTileOf(level, pieceId)];
  return tile ? tile.y * level.width + tile.x : null;
}

/**
 * The piece a tile is, for explaining it again when it's tapped (most special first: a twin that also cracks is a
 * twin). A light switch belongs to its gate. Plain mirrors, lamps and Lumis are 'basics'.
 */
export function pieceOfTile(tile) {
  if (tile.type === TILE.SWITCH) return PIECES.find((piece) => piece.id === 'gate');
  return [...PIECES].reverse().find((piece) => piece.id !== 'basics' && HAS[piece.id]?.(tile)) ?? PIECES[0];
}
