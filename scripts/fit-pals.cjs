// Gives every Pal drawing the same size on screen, so growing up shows in how a Pal looks, never in how big it is.
// Measures each drawing's main figure (the largest solid shape, so sparkles and glows don't count) and writes
// the scale that brings it to one shared size (the typical Champ), capped so it still fits the stage.
// Run after adding or redrawing Pals: npm run pals:fit (needs Playwright's Chromium).
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const DRAWINGS = path.join(__dirname, '../src/assets/pals/drawn');
const OUT = path.join(__dirname, '../src/components/pals/palFit.json');
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
  let best = null;
  for (let start = 0; start < size * size; start += 1) {
    if (!solid(start) || seen[start]) continue;
    const stack = [start];
    seen[start] = 1;
    const box = { count: 0, top: size, left: size, right: 0, bottom: 0 };
    while (stack.length) {
      const index = stack.pop();
      const y = Math.floor(index / size);
      const x = index % size;
      box.count += 1;
      box.top = Math.min(box.top, y); box.bottom = Math.max(box.bottom, y);
      box.left = Math.min(box.left, x); box.right = Math.max(box.right, x);
      for (const next of [x > 0 ? index - 1 : -1, x < size - 1 ? index + 1 : -1, index - size, index + size]) {
        if (next >= 0 && next < size * size && !seen[next] && solid(next)) { seen[next] = 1; stack.push(next); }
      }
    }
    if (!best || box.count > best.count) best = box;
  }
  const unit = 100 / size;
  return { height: (best.bottom - best.top) * unit, width: (best.right - best.left) * unit };
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const figures = {};
  for (const file of fs.readdirSync(DRAWINGS).filter((name) => name.endsWith('.svg')).sort()) {
    figures[file.replace('.svg', '')] = await page.evaluate(measureFigure, { svg: fs.readFileSync(path.join(DRAWINGS, file), 'utf8'), size: RENDER });
  }
  await browser.close();

  const sizeOf = ({ height, width }) => Math.sqrt(height * width);
  const champs = Object.entries(figures).filter(([id]) => id.endsWith('-4')).map(([, figure]) => sizeOf(figure)).sort((a, b) => a - b);
  const target = champs[Math.floor(champs.length / 2)];
  const fit = {};
  for (const [id, figure] of Object.entries(figures)) {
    const scale = Math.min(target / sizeOf(figure), 92 / figure.height, 96 / figure.width);
    fit[id] = Number(scale.toFixed(3));
  }
  fs.writeFileSync(OUT, `${JSON.stringify(fit, null, 2)}\n`);
  console.log(`Fitted ${Object.keys(fit).length} drawings to size ${target.toFixed(1)} → ${path.relative(process.cwd(), OUT)}`);
})();
