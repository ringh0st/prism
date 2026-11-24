/**
 * Stamps for the blank sheet: shapes that take the crayon's color (and glitter), and little Pals in their own
 * colors. A tap puts one down, a bit turned each time, like a real rubber stamp.
 */
const SHAPES = {
  star: 'M50 6l13 27 30 4-22 21 5 30-26-14-26 14 5-30L7 37l30-4z',
  heart: 'M50 88C20 66 6 50 6 32 6 18 17 8 30 8c9 0 16 5 20 12 4-7 11-12 20-12 13 0 24 10 24 24 0 18-14 34-44 56z',
  flower: 'M50 30a14 14 0 1 1 18-14 14 14 0 1 1 6 22 14 14 0 1 1-12 20 14 14 0 1 1-24 0 14 14 0 1 1-12-20 14 14 0 1 1 6-22 14 14 0 1 1 18 14z',
  sun: 'M50 26a24 24 0 1 1 0 48 24 24 0 1 1 0-48zM47 2h6v16h-6zM47 82h6v16h-6zM2 47h16v6H2zM82 47h16v6H82zM14 18l4-4 11 11-4 4zM71 75l4-4 11 11-4 4zM18 86l-4-4 11-11 4 4zM75 29l-4-4 11-11 4 4z',
  moon: 'M62 6a44 44 0 1 0 32 66A36 36 0 0 1 62 6z',
  cloud: 'M28 76a20 20 0 0 1-2-40 26 26 0 0 1 49-6 22 22 0 0 1 3 46z',
};
export const SHAPE_STAMPS = Object.keys(SHAPES);
export const PAL_STAMPS = ['waffles', 'mochi', 'ribbit', 'peep', 'bruno', 'coral', 'bamboo', 'buzz'];
export const STAMPS = [...SHAPE_STAMPS, ...PAL_STAMPS];
export const STAMP_SIZE = 150; // on the 800-wide sheet

const pathCache = new Map();
const shapePath = (name) => {
  if (!pathCache.has(name)) pathCache.set(name, new Path2D(SHAPES[name]));
  return pathCache.get(name);
};

/** The Pals' own colored drawings (their Baby form), as pictures. */
const palDrawings = import.meta.glob('../../src/assets/pals/drawn/{waffles,mochi,ribbit,peep,bruno,coral,bamboo,buzz}-1.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});
export const palStampUrl = (id) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(palDrawings[`../../src/assets/pals/drawn/${id}-1.svg`])}`;
const palImages = new Map();
export function loadPalStamps() {
  return Promise.all(
    PAL_STAMPS.map(async (id) => {
      if (palImages.has(id)) return;
      const image = new Image();
      image.src = palStampUrl(id);
      await image.decode().catch(() => {});
      palImages.set(id, image);
    }),
  );
}

/** Draws one stamp mark. `paint(context, color)` gives the crayon fill for shapes. */
export function drawStamp(context, { s, c, x, y, size, turn }, scale, paint) {
  context.save();
  context.translate(x * scale, y * scale);
  context.rotate(turn);
  const px = size * scale;
  if (SHAPES[s]) {
    context.scale(px / 100, px / 100);
    context.translate(-50, -50);
    context.fillStyle = paint(context, c);
    context.fill(shapePath(s));
  } else if (palImages.get(s)?.complete) {
    context.drawImage(palImages.get(s), -px / 2, -px / 2, px, px);
  }
  context.restore();
}

/** The outline of a shape stamp (for its button). */
export const shapeOf = (name) => SHAPES[name];
