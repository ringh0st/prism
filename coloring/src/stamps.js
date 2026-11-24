/**
 * Stickers for the blank sheet, in two lists (owner: shapes stay where they're put, Pals can be moved):
 * - shapes in the crayon's color (and glitter), with the plain ones a child builds with (a square and a triangle
 *   make a house, a rectangle a door, circles wheels and windows), and pictures in their own colors (trees, a
 *   rainbow, a car…). Drag to make one as big or small as you like (a tap puts down the usual size); it stays.
 * - little Pals in their own colors: one follows the finger and lands where it's let go, and can be picked up
 *   and moved again later.
 */
const SHAPES = {
  square: 'M10 10h80v80H10z',
  triangle: 'M50 8 94 88H6z',
  rectangle: 'M28 4h44v92H28z',
  circle: 'M50 6a44 44 0 1 1 0 88 44 44 0 1 1 0-88z',
  star: 'M50 6l13 27 30 4-22 21 5 30-26-14-26 14 5-30L7 37l30-4z',
  heart: 'M50 88C20 66 6 50 6 32 6 18 17 8 30 8c9 0 16 5 20 12 4-7 11-12 20-12 13 0 24 10 24 24 0 18-14 34-44 56z',
  sun: 'M50 26a24 24 0 1 1 0 48 24 24 0 1 1 0-48zM47 2h6v16h-6zM47 82h6v16h-6zM2 47h16v6H2zM82 47h16v6H82zM14 18l4-4 11 11-4 4zM71 75l4-4 11 11-4 4zM18 86l-4-4 11-11 4 4zM75 29l-4-4 11-11 4 4z',
  moon: 'M62 6a44 44 0 1 0 32 66A36 36 0 0 1 62 6z',
  cloud: 'M28 76a20 20 0 0 1-2-40 26 26 0 0 1 49-6 22 22 0 0 1 3 46z',
  flower: 'M50 30a14 14 0 1 1 18-14 14 14 0 1 1 6 22 14 14 0 1 1-12 20 14 14 0 1 1-24 0 14 14 0 1 1-12-20 14 14 0 1 1 6-22 14 14 0 1 1 18 14z',
  grass: 'M2 96 12 58l8 38 10-46 8 46 10-42 8 42 10-48 8 48 10-40 8 40z',
};

const ink = 'stroke="#4a3426" stroke-width="2.5" stroke-linejoin="round"';
const PICTURES = {
  tree: `<rect x="43" y="56" width="14" height="40" rx="3" fill="#9a6440" ${ink}/><circle cx="50" cy="36" r="26" fill="#58ac82" ${ink}/><circle cx="32" cy="48" r="16" fill="#58ac82" ${ink}/><circle cx="68" cy="48" r="16" fill="#58ac82" ${ink}/><circle cx="42" cy="30" r="5" fill="#7cc66d"/><circle cx="62" cy="40" r="4" fill="#e8524f"/><circle cx="38" cy="50" r="4" fill="#e8524f"/>`,
  pine: `<rect x="44" y="78" width="12" height="18" fill="#9a6440" ${ink}/><path d="M50 4 76 40H62l20 22H66l18 18H16l18-18H18l20-22H24z" fill="#3ea05a" ${ink}/>`,
  bush: `<path d="M10 90c-6-18 8-30 20-26 0-14 18-20 26-10 8-10 26-4 26 10 12-2 18 14 10 26z" fill="#7cc66d" ${ink}/><circle cx="34" cy="74" r="4" fill="#f284b5"/><circle cx="60" cy="68" r="4" fill="#f7cf3d"/><circle cx="74" cy="80" r="4" fill="#f284b5"/>`,
  tulip: `<path d="M50 52v42" stroke="#3ea05a" stroke-width="5"/><path d="M50 78c-14-2-22-12-22-22 12 2 20 10 22 22z" fill="#58ac82" ${ink}/><path d="M32 18l9 10 9-14 9 14 9-10c4 20-2 36-18 36S28 38 32 18z" fill="#e8524f" ${ink}/>`,
  rainbow: `<path d="M6 80a44 44 0 0 1 88 0" fill="none" stroke="#e8524f" stroke-width="8"/><path d="M14 80a36 36 0 0 1 72 0" fill="none" stroke="#f5923e" stroke-width="8"/><path d="M22 80a28 28 0 0 1 56 0" fill="none" stroke="#f7cf3d" stroke-width="8"/><path d="M30 80a20 20 0 0 1 40 0" fill="none" stroke="#58ac82" stroke-width="8"/><path d="M38 80a12 12 0 0 1 24 0" fill="none" stroke="#5bb7ea" stroke-width="8"/><circle cx="10" cy="84" r="10" fill="#fff" ${ink}/><circle cx="90" cy="84" r="10" fill="#fff" ${ink}/>`,
  butterfly: `<path d="M48 48C36 20 8 22 12 42s26 14 36 6zM52 48c12-28 40-26 36-6S62 56 52 48zM48 52c-10 4-30 14-24 28s22 0 24-20zM52 52c10 4 30 14 24 28S54 80 52 60z" fill="#f284b5" ${ink}/><rect x="46" y="36" width="8" height="40" rx="4" fill="#4a3426"/><circle cx="26" cy="38" r="5" fill="#f7cf3d"/><circle cx="74" cy="38" r="5" fill="#f7cf3d"/>`,
  car: `<path d="M8 66v-12c0-6 4-10 10-10h12l12-16h24l12 16h6c6 0 8 4 8 10v12z" fill="#e8524f" ${ink}/><path d="M38 44l8-12h10v12zM62 44V32h4l8 12z" fill="#bfe3ff" ${ink}/><circle cx="28" cy="68" r="10" fill="#4a3426"/><circle cx="74" cy="68" r="10" fill="#4a3426"/><circle cx="28" cy="68" r="4" fill="#ddd"/><circle cx="74" cy="68" r="4" fill="#ddd"/>`,
  balloon: `<path d="M50 64c-4 10 6 16 0 32" fill="none" stroke="#4a3426" stroke-width="2"/><ellipse cx="50" cy="34" rx="24" ry="30" fill="#5bb7ea" ${ink}/><path d="M46 62h8l-4 6z" fill="#5bb7ea" ${ink}/><ellipse cx="42" cy="24" rx="5" ry="8" fill="#fff" opacity=".6"/>`,
  bird: `<path d="M14 54c6-20 30-28 46-16l18-8-6 14c10 14-2 34-24 34C30 78 12 70 14 54z" fill="#f7cf3d" ${ink}/><path d="M30 52c8 8 20 8 26 0-8-4-18-6-26 0z" fill="#f5923e" ${ink}/><circle cx="64" cy="42" r="3" fill="#4a3426"/><path d="M76 44l12 4-12 4z" fill="#f5923e" ${ink}/>`,
  fish: `<path d="M14 50c14-22 44-24 60 0-16 24-46 22-60 0z" fill="#f5923e" ${ink}/><path d="M74 50l20-16v32z" fill="#f5923e" ${ink}/><circle cx="30" cy="46" r="4" fill="#4a3426"/><path d="M44 36c4 8 4 20 0 28" fill="none" stroke="#4a3426" stroke-width="2"/>`,
};

export const SHAPE_STAMPS = Object.keys(SHAPES);
export const PICTURE_STAMPS = Object.keys(PICTURES);
export const PAL_STAMPS = ['waffles', 'mochi', 'ribbit', 'peep', 'bruno', 'coral', 'bamboo', 'buzz'];
export const STAMP_SIZE = 150; // a sticker put down with a tap, on the 800-wide sheet
export const PAL_SIZE = 170;

const pathCache = new Map();
const shapePath = (name) => {
  if (!pathCache.has(name)) pathCache.set(name, new Path2D(SHAPES[name]));
  return pathCache.get(name);
};

/** The Pals' own colored drawings (their Baby form) and the picture stickers, as pictures. */
const palDrawings = import.meta.glob('../../src/assets/pals/drawn/{waffles,mochi,ribbit,peep,bruno,coral,bamboo,buzz}-1.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const svgUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
export const stickerUrl = (id) =>
  PICTURES[id]
    ? svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${PICTURES[id]}</svg>`)
    : svgUrl(palDrawings[`../../src/assets/pals/drawn/${id}-1.svg`]);
const images = new Map();
export function loadStickerImages() {
  return Promise.all(
    [...PICTURE_STAMPS, ...PAL_STAMPS].map(async (id) => {
      if (images.has(id)) return;
      const image = new Image();
      image.src = stickerUrl(id);
      await image.decode().catch(() => {});
      images.set(id, image);
    }),
  );
}

/** Draws one sticker. `paint(context, color)` gives the crayon fill for shapes; `isLifted` adds a shadow under it. */
export function drawStamp(context, { s, c, x, y, size, w = size, h = size, turn = 0 }, scale, paint, isLifted = false) {
  context.save();
  context.translate(x * scale, y * scale);
  context.rotate(turn);
  if (isLifted) {
    context.shadowColor = 'rgba(60, 30, 5, 0.35)';
    context.shadowBlur = 14 * scale * 4;
    context.shadowOffsetY = 8 * scale * 4;
  }
  const pw = w * scale;
  const ph = h * scale;
  if (SHAPES[s]) {
    context.scale(pw / 100, ph / 100);
    context.translate(-50, -50);
    context.fillStyle = paint(context, c);
    context.fill(shapePath(s));
  } else if (images.get(s)?.complete) {
    context.drawImage(images.get(s), -pw / 2, -ph / 2, pw, ph);
  }
  context.restore();
}

/** The Pal sticker under a point on the sheet, newest first (to pick it up and move it), or -1. Shapes and pictures stay put. */
export function palAt(marks, x, y) {
  for (let i = marks.length - 1; i >= 0; i--) {
    const m = marks[i];
    if (m.t === 'stamp' && PAL_STAMPS.includes(m.s) && Math.hypot(m.x - x, m.y - y) < (m.w ?? m.size) * 0.45) return i;
  }
  return -1;
}

/** The outline of a shape sticker (for its button). */
export const shapeOf = (name) => SHAPES[name];
