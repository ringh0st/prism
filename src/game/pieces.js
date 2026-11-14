import { TILE } from './constants.js';

/*
 * The pieces a player meets along the way. The first level that has a piece they've never seen
 * introduces it ("New piece!"), Candy Crush style. Order = the order they're shown in.
 */
export const PIECES = [
  {
    id: 'basics',
    name: 'Mirrors and gems',
    text: 'Tap a mirror to turn it. Bend the light from the lamp into every gem to light it up!',
    lumi: 'This is where the magic starts!',
    sample: { type: TILE.MIRROR, orient: 0 },
  },
  {
    id: 'wall',
    name: 'Walls',
    text: 'Walls block the light. Find a way around them.',
    lumi: 'Bonk! Light can’t go through.',
    sample: { type: TILE.WALL },
  },
  {
    id: 'locked',
    name: 'Fixed mirrors',
    text: 'These mirrors are stuck in place. You can’t turn them, so plan around them.',
    lumi: 'This one won’t budge. I tried!',
    sample: { type: TILE.MIRROR, orient: 1, locked: true },
  },
  {
    id: 'splitter',
    name: 'Splitters',
    text: 'A splitter lets light go straight through and bounces a copy sideways. One beam becomes two!',
    lumi: 'Twice the light, twice the fun!',
    sample: { type: TILE.SPLITTER, orient: 0 },
  },
  {
    id: 'color',
    name: 'Color glass',
    text: 'Light that passes through colored glass takes on its color. Colored gems only light up with their own color (match the shapes too).',
    lumi: 'Instant makeover for your light!',
    sample: { type: TILE.FILTER, color: 'lime' },
  },
  {
    id: 'shade',
    name: 'Shadow crystals',
    text: 'Never let the light touch a shadow crystal! Keep your beams away from it.',
    lumi: 'Eek! Don’t wake the shadow crystal!',
    sample: { type: TILE.SHADE },
  },
  {
    id: 'twins',
    name: 'Twin mirrors',
    text: 'Mirrors with the same little mark are twins: turn one and its twin turns too!',
    lumi: 'They do everything together. Cute!',
    sample: { type: TILE.MIRROR, orient: 0, link: 'a' },
  },
  {
    id: 'portal',
    name: 'Portals',
    text: 'Light that goes into a portal comes out of its partner (the one with the same pattern), still going the same way.',
    lumi: 'Whoosh! Light can teleport now?!',
    sample: { type: TILE.PORTAL, pair: 'a' },
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
};

/** Where each piece is first taught (levels are built so each one brings at most one new piece). */
export const PIECE_FIRST_LEVEL = {
  basics: 'w1-01',
  wall: 'w1-04',
  locked: 'w1-10',
  splitter: 'w2-01',
  color: 'w3-01',
  shade: 'w4-01',
  twins: 'w6-01',
  portal: 'w8-01',
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
