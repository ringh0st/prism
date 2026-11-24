import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CRAYONS, RAINBOW, canUndo, cleanPage, colorFor, emptyBook, isPageDone, moveSavedParts, paintPart, restoreBook, undoOnPage } from './book.js';

const page = { id: 'waffles', parts: [{}, {}, {}] };

test('painting a part and taking it back', () => {
  let book = paintPart(emptyBook(), 'waffles', 0, '#e8524f');
  book = paintPart(book, 'waffles', 0, '#3f6fd8');
  assert.equal(book.colors.waffles[0], '#3f6fd8');
  ({ book } = undoOnPage(book, 'waffles'));
  assert.equal(book.colors.waffles[0], '#e8524f');
  ({ book } = undoOnPage(book, 'waffles'));
  assert.equal(book.colors.waffles[0], undefined);
  assert.equal(canUndo(book, 'waffles'), false);
});

test('undo only takes back taps on the page that is open', () => {
  let book = paintPart(emptyBook(), 'waffles', 0, '#e8524f');
  book = paintPart(book, 'ember', 1, '#f5923e');
  const { book: after, part } = undoOnPage(book, 'waffles');
  assert.equal(part, 0);
  assert.equal(after.colors.ember[1], '#f5923e');
});

test('a page is finished when every part has a color, white too', () => {
  let book = emptyBook();
  for (const part of [0, 1]) book = paintPart(book, 'waffles', part, '#ffffff');
  assert.equal(isPageDone(book, page), false);
  book = paintPart(book, 'waffles', 2, '#ffffff');
  assert.equal(isPageDone(book, page), true);
  assert.equal(isPageDone(cleanPage(book, 'waffles'), page), false);
});

test('the rainbow crayon moves on with each tap; the others keep their color', () => {
  assert.equal(colorFor('rainbow', 0), RAINBOW[0]);
  assert.equal(colorFor('rainbow', 1), RAINBOW[1]);
  assert.equal(colorFor('red', 5), CRAYONS[0].color);
});

test('a broken save starts a fresh book', () => {
  assert.deepEqual(restoreBook('nonsense'), emptyBook());
  assert.deepEqual(restoreBook({ colors: { waffles: { 0: '#fff' } } }).colors.waffles, { 0: '#fff' });
});

for (const [name, list, folder, prefix] of [
  ['little', './pages.json', './pages/', ''],
  ['big', './pages-big.json', './pages-big/', 'big-'],
]) {
  test(`${name} book: every Pal has a page, and every page has parts to color that match its drawing`, () => {
    const pages = JSON.parse(readFileSync(new URL(list, import.meta.url), 'utf8'));
    const files = readdirSync(new URL(folder, import.meta.url)).filter((f) => f.endsWith('.svg'));
    assert.equal(files.length, pages.length);
    assert.ok(pages.length >= 48);
    for (const p of pages) {
      assert.ok(p.id.startsWith(prefix), `${p.id} is named for its book`);
      const svg = readFileSync(new URL(`${folder}${p.id.slice(prefix.length)}.svg`, import.meta.url), 'utf8');
      const marked = new Set([...svg.matchAll(/data-r="(\d+)"/g)].map((m) => Number(m[1])));
      assert.ok(p.parts.length >= (name === 'big' ? 20 : 2), `${p.id} has enough to color`);
      assert.deepEqual(
        [...marked].sort((a, b) => a - b),
        p.parts.map((_, i) => i),
        `${p.id}: every part is in the drawing`,
      );
      assert.ok(!svg.includes('#00ff00'), `${p.id}: no measuring colors left`);
    }
  });
}

test('free drawings: strokes add up, the last one comes back off, and a cleared sheet is blank', async () => {
  const { addStroke, clearSketch, isBlank, newSketch, undoStroke } = await import('./sketches.js');
  let sketch = newSketch('s1');
  assert.equal(isBlank(sketch), true);
  sketch = addStroke(sketch, { c: '#e8524f', w: 26, p: [10, 10, 40, 40] });
  sketch = addStroke(sketch, { c: '#3f6fd8', w: 26, p: [50, 50] });
  assert.equal(sketch.strokes.length, 2);
  assert.equal(undoStroke(sketch).strokes.at(-1).c, '#e8524f');
  assert.equal(isBlank(clearSketch(sketch)), true);
});

test('the wall shows colored pages newest first', async () => {
  const { coloredPageIds } = await import('./book.js');
  const book = { colors: { a: { 0: '#fff' }, b: { 1: '#000' }, c: {} }, history: [], touched: { a: 1, b: 5 } };
  assert.deepEqual(coloredPageIds(book), ['b', 'a']);
});

test('a replay counts a line by its points and a stamp as one step', async () => {
  const { stepsOf } = await import('./sketches.js');
  assert.equal(stepsOf({ c: '#000', w: 12, p: [0, 0, 10, 10, 20, 20] }), 3);
  assert.equal(stepsOf({ t: 'stamp', s: 'star', c: '#000', x: 1, y: 1, size: 150, turn: 0 }), 1);
});

test('saved colors move with their parts when a page changes', () => {
  const moves = { 'big-x': [0, null, 1] };
  assert.deepEqual(moveSavedParts({ 'big-x': { 0: 'a', 1: 'gone', 2: 'c' }, other: { 1: 'b' } }, moves), { 'big-x': { 0: 'a', 1: 'c' }, other: { 1: 'b' } });
  const restored = restoreBook({ colors: { 'big-basil': { 0: '#111' } }, history: [{ pageId: 'big-basil', part: 0, was: null }] });
  assert.equal(restored.history.length, 0, 'no undo across the move');
  assert.equal(restoreBook(restored).colors['big-basil'][0], '#111', 'moved only once');
});
