// Gives every Pal drawing the same size on screen, so growing up shows in how a Pal looks, never in how big it is.
// Measures each drawing's main figure (the largest solid shape, so sparkles and glows don't count) and writes
// the scale that brings it to one shared size (the typical Champ), capped so it still fits the stage.
// It also measures each drawing's head, so hats sit snugly (palOutfitFit.json): the head's top (where it's wide, so
// ears, horns and crowns don't count) and the forehead's width.
// Run after adding or redrawing Pals: npm run pals:fit (needs Playwright's Chromium).
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const DRAWINGS = path.join(__dirname, '../src/assets/pals/drawn');
const OUT = path.join(__dirname, '../src/components/pals/palFit.json');
const OUTFIT_OUT = path.join(__dirname, '../src/components/pals/palOutfitFit.json');
const RENDER = 200; // px per 100 stage units

/** Runs in the page: the stage-unit box of the largest solid shape in an SVG. */
async function measureFigure({ svg, size }) {
  const image = new Image();
  image.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);
  const solid = (index) => data[index * 4 + 3] > 200;
  const seen = new Uint8Array(size * size);
  const blob = new Int32Array(size * size).fill(-1);
  let best = null;
  let blobId = 0;
  for (let start = 0; start < size * size; start += 1) {
    if (!solid(start) || seen[start]) continue;
    const stack = [start];
    seen[start] = 1;
    const box = { count: 0, top: size, left: size, right: 0, bottom: 0, id: blobId };
    while (stack.length) {
      const index = stack.pop();
      blob[index] = blobId;
      const y = Math.floor(index / size);
      const x = index % size;
      box.count += 1;
      box.top = Math.min(box.top, y);
      box.bottom = Math.max(box.bottom, y);
      box.left = Math.min(box.left, x);
      box.right = Math.max(box.right, x);
      for (const next of [x > 0 ? index - 1 : -1, x < size - 1 ? index + 1 : -1, index - size, index + size]) {
        if (next >= 0 && next < size * size && !seen[next] && solid(next)) {
          seen[next] = 1;
          stack.push(next);
        }
      }
    }
    if (!best || box.count > best.count) best = box;
    blobId += 1;
  }
  const unit = 100 / size;
  // The run of the figure through the middle column on a row (in pixels), or 0.
  const inFigure = (x, y) => blob[y * size + x] === best.id;
  const runAt = (y) => {
    const middle = Math.round(size / 2);
    if (!inFigure(middle, y)) return { width: 0, left: middle, right: middle };
    let left = middle;
    let right = middle;
    while (left > 0 && inFigure(left - 1, y)) left -= 1;
    while (right < size - 1 && inFigure(right + 1, y)) right += 1;
    return { width: right - left, left, right };
  };
  // Head top: the first row where the figure is at least a quarter of the stage wide through the middle.
  let headTop = best.top;
  while (headTop < best.bottom && runAt(headTop).width < size * 0.26) headTop += 1;
  const headRow = runAt(Math.min(best.bottom, headTop + Math.round(size * 0.08)));
  // The forehead: the figure's width at y=44 (below the ears, above the eyes at y≈51).
  const forehead = runAt(Math.round(size * 0.44));
  return {
    height: (best.bottom - best.top) * unit,
    width: (best.right - best.left) * unit,
    head: { top: headTop * unit, width: headRow.width * unit, middle: ((headRow.left + headRow.right) / 2) * unit, forehead: forehead.width * unit },
  };
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const figures = {};
  for (const file of fs
    .readdirSync(DRAWINGS)
    .filter((name) => name.endsWith('.svg'))
    .sort()) {
    figures[file.replace('.svg', '')] = await page.evaluate(measureFigure, { svg: fs.readFileSync(path.join(DRAWINGS, file), 'utf8'), size: RENDER });
  }
  await browser.close();

  const sizeOf = ({ height, width }) => Math.sqrt(height * width);
  const champs = Object.entries(figures)
    .filter(([id]) => id.endsWith('-4'))
    .map(([, figure]) => sizeOf(figure))
    .sort((a, b) => a - b);
  const target = champs[Math.floor(champs.length / 2)];
  const fit = {};
  for (const [id, figure] of Object.entries(figures)) {
    const scale = Math.min(target / sizeOf(figure), 92 / figure.height, 96 / figure.width);
    fit[id] = Number(scale.toFixed(3));
  }
  fs.writeFileSync(OUT, `${JSON.stringify(fit, null, 2)}\n`);
  // How hats sit on each drawing (palOutfitFit.json): `drop` lowers them onto heads that sit lower than the shared
  // head top (y=25; crowns and manes above it don't lift them), and `scale` widens them to the forehead (hats are
  // drawn for a 46-wide head), so a hat is worn rather than perched.
  const outfit = {};
  for (const [id, { head }] of Object.entries(figures)) {
    // At most 5 lower, so the brim always stays above the eyes (a star's point measures lower than its head).
    const drop = Math.min(5, Math.max(0, head.top - 25));
    const scale = Math.min(1.3, Math.max(0.95, head.forehead / 46));
    if (drop > 0.5 || Math.abs(scale - 1) > 0.02) outfit[id] = { drop: Number(drop.toFixed(1)), scale: Number(scale.toFixed(2)) };
  }
  fs.writeFileSync(OUTFIT_OUT, `${JSON.stringify(outfit)}\n`);
  console.log(`Fitted ${Object.keys(fit).length} drawings to size ${target.toFixed(1)} → ${path.relative(process.cwd(), OUT)}`);
})();
