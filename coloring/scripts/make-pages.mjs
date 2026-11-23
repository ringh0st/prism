// Turns each Pal's Baby drawing into a coloring page: every part a child can fill becomes white with a soft ink
// outline, eyes and noses stay as they are, glows and shading go, and any part too small for a little finger is
// left in its own color, so every page can really be finished.
// Writes coloring/src/pages/<id>.svg and coloring/src/pages.json. Run: npm run coloring:pages (needs Playwright).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { PALS } from '../../src/game/pals.js';

const { chromium } = createRequire(import.meta.url)('playwright'); // the global Playwright, as pals:fit uses

const DRAWINGS = new URL('../../src/assets/pals/drawn/', import.meta.url);
const OUT = new URL('../src/pages/', import.meta.url);
const MIN_AREA = 5; // stage units² left after thinning: a part about 4×4 units, a fingertip on a phone page with tap snapping
const RENDER = 600;

/**
 * Runs in the page: cleans one drawing and returns the coloring page plus what it found.
 *
 * The drawings are built in layers (an outline pass of thick strokes or shapes under a fill pass, brush strokes
 * for tentacles), so parts are grouped by their paint and judged by pixels: a group a finger can fill (what still
 * shows after thinning it by THIN units on every side) becomes one paintable part; a thin one is an outline and
 * turns to ink; a tiny one keeps its color.
 */
async function makePage({ id, svg, minArea, size }) {
  const THIN = 1; // stage units
  const holder = document.createElement('div');
  holder.innerHTML = svg;
  document.body.append(holder);
  const root = holder.querySelector('svg');
  root.removeAttribute('width');
  root.removeAttribute('height');
  const INK = '#4a3426';
  const rgb = (text) => {
    const m = text.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(',').map(Number);
    return { r, g, b, a };
  };
  const lum = ({ r, g, b }) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  /** A gradient's middle stop stands for its color. */
  const paintOf = (value) => {
    if (!value || value === 'none') return null;
    const url = value.match(/url\("?#([^")]+)"?\)/);
    if (url) {
      const stops = [...(root.querySelector(`[id="${url[1]}"]`)?.querySelectorAll('stop') ?? [])];
      const stop = stops[Math.floor(stops.length / 2)];
      return stop ? rgb(getComputedStyle(stop).stopColor) : null;
    }
    return rgb(value);
  };
  const rootScale = Math.sqrt(Math.abs(root.getCTM().a * root.getCTM().d));
  const scaleOf = (el) => {
    const m = el.getCTM();
    return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) / rootScale;
  };
  const opacityOf = (el) => {
    let o = 1;
    for (let g = el; g && g !== root; g = g.parentElement) o *= Number(getComputedStyle(g).opacity);
    return o;
  };
  const boxArea = (el) => {
    const b = el.getBBox();
    const s = scaleOf(el);
    return b.width * b.height * s * s;
  };
  for (const el of root.querySelectorAll('[filter], filter')) el.remove();

  // 1. Sort every shape: kept as drawn, ink, or part of a group that may become paintable.
  const groups = new Map(); // key → { kind: 'fill' | 'stroke', members: [], color }
  const join = (key, kind, el, color) => {
    if (!groups.has(key)) groups.set(key, { kind, members: [], color });
    groups.get(key).members.push(el);
  };
  for (const el of root.querySelectorAll('path, circle, ellipse, rect, line, polygon, polyline')) {
    if (el.closest('clipPath, defs, mask')) continue;
    const style = getComputedStyle(el);
    const fill = paintOf(style.fill);
    const stroke = paintOf(style.stroke);
    const strokeWidth = parseFloat(style.strokeWidth) * scaleOf(el);
    const hasFill = fill && fill.a > 0 && Number(style.fillOpacity) > 0;
    const hasStroke = stroke && stroke.a > 0 && strokeWidth > 0 && Number(style.strokeOpacity) > 0;
    const opacity = opacityOf(el) * Number(style.fillOpacity) * (fill?.a ?? 1);
    if (!hasFill) {
      if (!hasStroke || lum(stroke) > 0.93)
        el.remove(); // nothing, or a white shine stroke
      else if (strokeWidth >= 3 && opacityOf(el) > 0.6) join(`stroke ${style.stroke} ${Math.round(strokeWidth)}`, 'stroke', el, hex(stroke));
      else if (lum(stroke) > 0.7)
        el.dataset.keep = '1'; // pale sparkles and glints stay as drawn
      else el.dataset.ink = 'line';
      continue;
    }
    if (opacity < 0.6) {
      // Soft shading and glows go; small rosy cheeks stay.
      const { r, g, b } = fill;
      if (!(r > 200 && r - b > 40 && r - g > 30 && boxArea(el) < 120) || hasStroke) el.remove();
      continue;
    }
    if (lum(fill) < 0.3) continue; // pupils, noses, mouths: drawn in already
    const isRosy = fill.r > 200 && fill.r - fill.b > 40 && fill.r - fill.g > 30;
    if (isRosy && !hasStroke && boxArea(el) < 120) continue; // rosy cheeks stay pink
    if (lum(fill) > 0.93 && !hasStroke && boxArea(el) < 40) continue; // eye shines
    if (hasStroke) join(`own ${groups.size}`, 'fill', el, hex(fill));
    else join(`fill ${style.fill}`, 'fill', el, hex(fill));
  }
  const list = [...groups.values()];

  // 2. Draw each group in its own flat color (everything else as it will look) and measure it.
  const show = (el, color) => {
    if (el.dataset.kind === 'stroke') el.setAttribute('stroke', color);
    else el.setAttribute('fill', color);
  };
  list.forEach((group, i) => {
    for (const el of group.members) {
      el.dataset.kind = group.kind;
      el.dataset.was = group.kind === 'stroke' ? (el.getAttribute('stroke') ?? '') : (el.getAttribute('fill') ?? '');
      el.setAttribute('opacity', '1');
      if (group.kind === 'fill' && el.getAttribute('stroke') && el.getAttribute('stroke') !== 'none') el.setAttribute('stroke', '#00ff00');
      show(el, `rgb(${i + 1}, 0, 255)`);
    }
  });
  for (const el of root.querySelectorAll('*')) el.setAttribute('shape-rendering', 'crispEdges');
  const image = new Image();
  image.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(root))))}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);
  for (const el of root.querySelectorAll('*')) el.removeAttribute('shape-rendering');
  const label = new Int16Array(size * size);
  for (let p = 0; p < size * size; p++) {
    const q = p * 4;
    label[p] = data[q + 1] === 0 && data[q + 2] === 255 && data[q + 3] === 255 ? data[q] : 0;
  }
  // Thinning: a pixel stays if its whole square of radius `r` has its label (rows first, then columns).
  const r = Math.round((THIN * size) / 100);
  const across = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    let start = 0;
    for (let x = 1; x <= size; x++) {
      if (x === size || label[y * size + x] !== label[y * size + start]) {
        for (let k = start + r; k < x - r; k++) across[y * size + k] = 1;
        start = x;
      }
    }
  }
  const visible = Array.from({ length: list.length }, () => 0);
  const solid = Array.from({ length: list.length }, () => 0);
  for (let x = 0; x < size; x++) {
    let start = 0;
    for (let y = 1; y <= size; y++) {
      const ok = (yy) => across[yy * size + x] === 1;
      if (y === size || label[y * size + x] !== label[start * size + x] || ok(y) !== ok(start)) {
        const l = label[start * size + x];
        if (l && ok(start)) for (let k = start + r; k < y - r; k++) solid[l - 1]++;
        start = y;
      }
    }
    for (let y = 0; y < size; y++) if (label[y * size + x]) visible[label[y * size + x] - 1]++;
  }
  const units = (count) => (count * 10000) / (size * size);

  // 3. Paintable, ink or kept, and the page as it will be printed.
  const parts = [];
  const notes = [];
  list.forEach((group, i) => {
    const shows = units(visible[i]);
    const core = units(solid[i]);
    let fate = 'paint';
    if (core < minArea) fate = shows > minArea * 3 && core < 1 ? 'ink' : 'keep';
    notes.push(`${group.kind[0]}${Math.round(shows)}/${Math.round(core)}${fate[0]}`);
    const k = parts.length;
    for (const el of group.members) {
      const was = el.dataset.was;
      el.removeAttribute('opacity');
      delete el.dataset.was;
      if (el.getAttribute('stroke') === '#00ff00') el.setAttribute('stroke', INK);
      if (fate === 'keep') {
        show(el, was);
        delete el.dataset.kind;
        continue;
      }
      if (fate === 'ink') {
        show(el, INK);
        delete el.dataset.kind;
        continue;
      }
      show(el, '#ffffff');
      el.dataset.r = String(k);
      if (el.getAttribute('stroke') === INK) {
        el.setAttribute('stroke-width', String(+(2.2 / scaleOf(el)).toFixed(2)));
        el.setAttribute('stroke-linejoin', 'round');
      }
    }
    if (fate === 'paint') parts.push({ kind: group.kind, color: group.color, area: Math.round(core) });
  });
  for (const el of root.querySelectorAll('[data-ink]')) {
    el.setAttribute('stroke', INK);
    el.removeAttribute('opacity');
    el.setAttribute('stroke-opacity', '0.8');
    delete el.dataset.ink;
  }
  for (const el of root.querySelectorAll('[data-keep]')) delete el.dataset.keep;
  // Gradients nothing uses any more go too.
  for (const gradient of root.querySelectorAll('linearGradient, radialGradient')) {
    if (!root.querySelector(`[fill="url(#${gradient.id})"], [stroke="url(#${gradient.id})"]`)) gradient.remove();
  }
  root.setAttribute('class', 'drawing');
  root.dataset.page = id;
  const out = new XMLSerializer().serializeToString(root).replace(/\n\s*\n/g, '\n');
  holder.remove();
  return { svg: out, parts, notes };
}

const browser = await chromium.launch();
const page = await browser.newPage();
const pages = [];
for (const pal of PALS) {
  let svg;
  try {
    svg = readFileSync(new URL(`${pal.id}-1.svg`, DRAWINGS), 'utf8');
  } catch {
    continue;
  }
  const made = await page.evaluate(makePage, { id: pal.id, svg, minArea: MIN_AREA, size: RENDER });
  writeFileSync(new URL(`${pal.id}.svg`, OUT), made.svg);
  pages.push({
    id: pal.id,
    name: pal.name,
    animal: pal.species,
    parts: made.parts.map(({ kind, color }) => (kind === 'stroke' ? { kind, color } : { color })),
  });
  console.log(`${pal.id.padEnd(10)} ${String(made.parts.length).padStart(2)} parts  ${made.notes.join(' ')}`);
}
writeFileSync(new URL('../src/pages.json', import.meta.url), `${JSON.stringify(pages, null, 1)}\n`);
await browser.close();
