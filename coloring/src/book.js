/**
 * The coloring book's state, kept on the device: the color of every part of every page, and what to take back.
 * Pure functions with no React or DOM, so they can be tested. A page is finished when every part has a color
 * (white counts: the child chose it).
 */
import PART_MOVES from './partMoves.json' with { type: 'json' };

export const CRAYONS = [
  { id: 'red', color: '#e8524f', name: 'Red' },
  { id: 'orange', color: '#f5923e', name: 'Orange' },
  { id: 'yellow', color: '#f7cf3d', name: 'Yellow' },
  { id: 'lime', color: '#a5d046', name: 'Lime' },
  { id: 'green', color: '#3ea05a', name: 'Green' },
  { id: 'teal', color: '#2fb3a6', name: 'Teal' },
  { id: 'sky', color: '#5bb7ea', name: 'Sky blue' },
  { id: 'blue', color: '#3f6fd8', name: 'Blue' },
  { id: 'purple', color: '#9466d4', name: 'Purple' },
  { id: 'pink', color: '#f284b5', name: 'Pink' },
  { id: 'peach', color: '#f7c39c', name: 'Peach' },
  { id: 'brown', color: '#9a6440', name: 'Brown' },
  { id: 'glitter', color: 'glitter', name: 'Glitter' },
  { id: 'black', color: '#3b3634', name: 'Black' },
  { id: 'white', color: '#ffffff', name: 'White' },
  { id: 'rainbow', color: null, name: 'Rainbow' },
];

/** The glitter crayon leaves gold with sparkles in it (a color of its own, drawn as a pattern). */
export const GLITTER = 'glitter';

/** The rainbow crayon gives each tap the next color of the rainbow. */
export const RAINBOW = ['#e8524f', '#f5923e', '#f7cf3d', '#a5d046', '#2fb3a6', '#3f6fd8', '#9466d4', '#f284b5'];

/** How many taps can be taken back. */
export const UNDO_DEPTH = 40;

export const emptyBook = () => ({ colors: {}, history: [], touched: {}, parts: PARTS_VERSION });

/**
 * Saved colors are kept by part number. When `npm run coloring:pages` changes a page's parts (a brush stroke's
 * outline used to count as a part to color), partMoves.json says where each old part went (null: gone), and a
 * book saved before is moved over once, so nobody's colors shift to other parts.
 */
const PARTS_VERSION = 2;
export function moveSavedParts(colors, moves = PART_MOVES) {
  return Object.fromEntries(
    Object.entries(colors).map(([pageId, page]) => {
      const move = moves[pageId];
      if (!move) return [pageId, page];
      const moved = {};
      for (const [part, color] of Object.entries(page)) if (move[part] != null) moved[move[part]] = color;
      return [pageId, moved];
    }),
  );
}

/** The color the crayon puts down now (the rainbow moves on with each tap). */
export function colorFor(crayonId, tapCount) {
  const crayon = CRAYONS.find((c) => c.id === crayonId) ?? CRAYONS[0];
  return crayon.color ?? RAINBOW[tapCount % RAINBOW.length];
}

/** Colors one part of a page; remembers what it was so it can be taken back. */
export function paintPart(book, pageId, part, color) {
  const page = book.colors[pageId] ?? {};
  if (page[part] === color) return book;
  const history = [...book.history, { pageId, part, was: page[part] ?? null }].slice(-UNDO_DEPTH);
  return { ...book, colors: { ...book.colors, [pageId]: { ...page, [part]: color } }, history, touched: { ...book.touched, [pageId]: Date.now() } };
}

/** Takes back the last tap on this page, if there is one. Returns the book and the part that changed. */
export function undoOnPage(book, pageId) {
  const at = book.history.findLastIndex((step) => step.pageId === pageId);
  if (at < 0) return { book, part: null };
  const { part, was } = book.history[at];
  const page = { ...book.colors[pageId] };
  if (was == null) delete page[part];
  else page[part] = was;
  const history = book.history.filter((_, i) => i !== at);
  return { book: { ...book, colors: { ...book.colors, [pageId]: page }, history }, part };
}

export const canUndo = (book, pageId) => book.history.some((step) => step.pageId === pageId);

/** A clean page again (nothing to take back on it afterwards). */
export function cleanPage(book, pageId) {
  const colors = { ...book.colors };
  delete colors[pageId];
  return { ...book, colors, history: book.history.filter((step) => step.pageId !== pageId) };
}

export const paintedCount = (book, page) => Object.keys(book.colors[page.id] ?? {}).length;
export const isPageDone = (book, page) => paintedCount(book, page) >= page.parts.length;

/** Pages with any color, newest first: they hang on the wall. */
export const coloredPageIds = (book) =>
  Object.keys(book.colors)
    .filter((id) => Object.keys(book.colors[id]).length)
    .sort((a, b) => (book.touched[b] ?? 0) - (book.touched[a] ?? 0));

/** What is saved on the device (the history is too, so a tap can be taken back after a reload). */
export function restoreBook(saved) {
  if (!saved || typeof saved !== 'object' || typeof saved.colors !== 'object') return emptyBook();
  const isOld = saved.parts !== PARTS_VERSION;
  const colors = isOld ? moveSavedParts(saved.colors ?? {}) : (saved.colors ?? {});
  const history = Array.isArray(saved.history) ? saved.history.slice(-UNDO_DEPTH) : [];
  // Taking back a tap made before the move would put a color on the wrong part: those steps go.
  const kept = isOld ? history.filter((step) => !PART_MOVES[step.pageId]) : history;
  return { colors, history: kept, touched: saved.touched ?? {}, parts: PARTS_VERSION };
}
