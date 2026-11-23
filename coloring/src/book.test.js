import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CRAYONS, RAINBOW, canUndo, cleanPage, colorFor, emptyBook, isPageDone, paintPart, restoreBook, undoOnPage } from './book.js';

const PAGES = JSON.parse(readFileSync(new URL('./pages.json', import.meta.url), 'utf8'));
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

test('every Pal has a page, and every page has parts to color that match its drawing', () => {
  const files = readdirSync(new URL('./pages/', import.meta.url)).filter((f) => f.endsWith('.svg'));
  assert.equal(files.length, PAGES.length);
  assert.ok(PAGES.length >= 48);
  for (const p of PAGES) {
    const svg = readFileSync(new URL(`./pages/${p.id}.svg`, import.meta.url), 'utf8');
    const marked = new Set([...svg.matchAll(/data-r="(\d+)"/g)].map((m) => Number(m[1])));
    assert.ok(p.parts.length >= 2, `${p.id} has something to color`);
    assert.deepEqual(
      [...marked].sort((a, b) => a - b),
      p.parts.map((_, i) => i),
      `${p.id}: every part is in the drawing`,
    );
    assert.ok(!svg.includes('#00ff00'), `${p.id}: no measuring colors left`);
  }
});
