// A full walk through the coloring book on an emulated phone (owner: "test after you finish everything"); any page error fails it.
// Run after every change: npm run coloring:check [address] (default: the dev server, npm run coloring -- --port 5198).
const { createRequire } = require('node:module');
const { chromium, devices } = createRequire(__filename)('playwright');
const assert = (ok, what) => {
  if (!ok) {
    console.log('FAIL:', what);
    process.exitCode = 1;
  } else console.log('ok:', what);
};
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ ...devices['iPhone 13'] });
  const p = await c.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
  const url = process.argv[2] || 'http://localhost:5198/';
  await p.goto(url);
  await p.evaluate(() => {
    localStorage.clear();
    indexedDB.deleteDatabase('coloring');
  });
  await p.reload();
  await p.waitForTimeout(1800);
  const pick = (name) => p.getByRole('radio', { name, exact: true }).dispatchEvent('click');
  const paintPixels = () =>
    p.evaluate(() => {
      const c = document.querySelector('.paint-layer');
      if (!c) return -1;
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
      return n;
    });
  const filled = () =>
    p.evaluate(
      () =>
        [...document.querySelectorAll('.sheet-frame svg [data-r]')].filter(
          (e) => !['#ffffff', null].includes(e.getAttribute(e.dataset.kind === 'stroke' ? 'stroke' : 'fill')),
        ).length,
    );
  const tapCenter = async (sel, fx = 0.5, fy = 0.5) => {
    const bb = await p.locator(sel).first().boundingBox();
    await p.mouse.click(bb.x + bb.width * fx, bb.y + bb.height * fy);
  };

  // 1. Little book: open from the desk, choose from the contents, color, back
  await p.getByRole('button', { name: /^Open My Pals/ }).tap();
  await p.waitForTimeout(1400);
  assert((await p.locator('.thumbs button').count()) === 48, 'little book contents shows 48 Pals');
  await p.locator('.thumbs button').nth(38).tap();
  await p.waitForTimeout(900);
  assert((await p.locator('.sheet-frame svg').count()) === 1, 'a little-book page opens as a sheet');
  await pick('Red');
  await tapCenter('.sheet-frame svg.drawing', 0.5, 0.4);
  await p.waitForTimeout(700);
  assert((await filled()) >= 1, 'tapping fills a part');
  await p.getByRole('button', { name: 'Take back the last color' }).tap();
  await p.waitForTimeout(300);
  assert((await filled()) === 0, 'undo takes the fill back');
  await tapCenter('.sheet-frame svg.drawing', 0.5, 0.4);
  await p.waitForTimeout(700);
  await p.getByRole('button', { name: 'Back to the book' }).tap();
  await p.waitForTimeout(600);
  // turn a page by the corner, open a page from the book itself
  await p.getByRole('button', { name: 'Turn the page' }).tap();
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: /^Color / }).tap();
  await p.waitForTimeout(900);
  assert((await p.locator('.sheet-frame svg').count()) === 1, 'a page opens from inside the book too');
  await p.getByRole('button', { name: 'Back to the book' }).tap();
  await p.waitForTimeout(500);
  await p.getByRole('button', { name: 'Back to my room' }).tap();
  await p.waitForTimeout(500);

  // 2. Big book: fill, paint thin and thick anywhere on the sheet, it stays after a while
  await p.getByRole('button', { name: /Big Pals/ }).tap();
  await p.waitForTimeout(1400);
  await p.locator('.thumbs button').nth(14).tap();
  await p.waitForTimeout(1200);
  await pick('Yellow');
  await tapCenter('.art', 0.5, 0.42);
  await p.waitForTimeout(700);
  assert((await filled()) >= 1, 'big page: the paint pot fills');
  await p.getByRole('radio', { name: 'Crayon, thick' }).tap();
  await pick('Blue');
  const sb = await p.locator('.sheet-frame .sheet-paper').boundingBox();
  await p.mouse.move(sb.x + 10, sb.y + 20);
  await p.mouse.down();
  await p.mouse.move(sb.x + sb.width - 10, sb.y + sb.height - 20, { steps: 14 });
  await p.mouse.up();
  await p.waitForTimeout(300);
  const px = await paintPixels();
  assert(px > 2000, 'big page: painting by hand shows');
  await p.waitForTimeout(4000);
  assert((await paintPixels()) > px * 0.9, 'big page: the paint is still there seconds later');
  await p.setViewportSize({ width: 390, height: 640 });
  await p.waitForTimeout(500);
  assert((await paintPixels()) > 1000, 'big page: the paint survives the screen changing size');
  await p.setViewportSize({ width: 390, height: 664 });
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: 'Back to the book' }).tap();
  await p.waitForTimeout(500);
  await p.getByRole('button', { name: 'Back to my room' }).tap();
  await p.waitForTimeout(500);

  // 3. Free drawing: crayon, bucket, sticker carried, undo, back to the wall
  await p.getByRole('button', { name: 'A blank sheet to draw on' }).tap();
  await p.waitForTimeout(900);
  const db = await p.locator('.sheet-frame .sheet-paper').boundingBox();
  await pick('Green');
  await p.mouse.move(db.x + 40, db.y + 300);
  await p.mouse.down();
  await p.mouse.move(db.x + 250, db.y + 320, { steps: 8 });
  await p.mouse.up();
  await p.getByRole('radio', { name: /Bucket/ }).tap();
  await pick('Sky blue');
  await p.mouse.click(db.x + 100, db.y + 100);
  await p.waitForTimeout(200);
  await p.getByRole('radio', { name: 'Stickers' }).tap();
  await p.waitForTimeout(200);
  await pick('tree');
  await p.mouse.move(db.x + 100, db.y + 100);
  await p.mouse.down();
  await p.mouse.move(db.x + 200, db.y + 250, { steps: 6 });
  await p.mouse.up();
  await p.waitForTimeout(300);
  const marks = () =>
    p.evaluate(
      () =>
        new Promise((res) => {
          const r = indexedDB.open('coloring');
          r.onsuccess = () => {
            const q = r.result.transaction('sketches').objectStore('sketches').getAll();
            q.onsuccess = () => res(q.result.filter((s) => !s.id.startsWith('paint-')).map((s) => s.strokes.map((m) => m.t ?? 'line')));
          };
        }),
    );
  assert(JSON.stringify(await marks()) === JSON.stringify([['line', 'bg', 'stamp']]), 'drawing keeps a line, a background and a sticker');
  await p.getByRole('button', { name: 'Take back the last color' }).tap();
  await p.waitForTimeout(300);
  assert(JSON.stringify(await marks()) === JSON.stringify([['line', 'bg']]), 'undo takes the sticker back');
  await p.getByRole('button', { name: 'Back to My Drawings' }).tap();
  await p.waitForTimeout(800);
  assert((await p.locator('.wall-grid li:not(.start-new)').count()) === 1, 'the drawing hangs on My Drawings');
  await p.locator('.wall-grid li:not(.start-new) .framed').first().tap();
  await p.waitForTimeout(5000);
  assert((await p.locator('.sketch-canvas').count()) === 1, 'a drawing opens again from the wall (and replays)');
  await p.getByRole('button', { name: 'Back to My Drawings' }).tap();
  await p.waitForTimeout(500);
  await p.getByRole('button', { name: 'Back to my room' }).tap();
  await p.waitForTimeout(500);

  // 4. Walls, removing, night, and everything kept after a reload
  await p.getByRole('button', { name: /^My Pals,/ }).tap();
  await p.waitForTimeout(700);
  const pals = await p.locator('.wall-grid li:not(.start-new)').count();
  assert(pals === 2, 'My Pals shows the little and the big page');
  await p.locator('.wall-grid li:not(.start-new) .framed').last().tap();
  await p.waitForTimeout(900);
  assert((await p.locator('.sheet-frame svg').count()) === 1, 'a colored page opens again from the wall');
  await p.getByRole('button', { name: 'Back to My Pals' }).tap();
  await p.waitForTimeout(500);
  await p.getByRole('button', { name: 'Take pictures off the wall' }).tap();
  await p.getByRole('button', { name: 'Take this picture off the wall' }).first().tap();
  await p.getByRole('button', { name: 'Yes, take it off' }).tap();
  await p.waitForTimeout(400);
  assert((await p.locator('.wall-grid li:not(.start-new)').count()) === pals - 1, 'a picture can be taken off the wall');
  await p.getByRole('button', { name: 'Back to my room' }).tap();
  await p.waitForTimeout(400);
  await p.getByRole('button', { name: 'Night' }).tap();
  await p.waitForTimeout(200);
  assert((await p.evaluate(() => document.documentElement.dataset.theme)) === 'night', 'the night switch works');
  await p.reload();
  await p.waitForTimeout(1800);
  assert((await p.evaluate(() => document.documentElement.dataset.theme)) === 'night', 'night is remembered');
  assert((await p.getByRole('button', { name: /^My Drawings,/ }).getAttribute('aria-label')).includes('1 picture'), 'the drawing is kept after a reload');
  assert(errors.length === 0, `no errors (${errors.join(' | ')})`);
  await b.close();
})();
