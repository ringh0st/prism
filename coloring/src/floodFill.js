/**
 * The bucket on the blank sheet: like a real paint bucket, a tap fills the area around it up to the lines (a
 * closed triangle, a house, or the whole background when nothing closes it). Crayon lines have tiny gaps in their
 * wax, so the lines are thickened by a few pixels before the fill spreads (it can't leak through), then the fill
 * grows back under that rim so no paper shows between the fill and the line.
 */
const GAP = 2; // pixels a line is thickened by

/** Pixels that look like the tapped one: as transparent (bare paper), or close in color. */
function likeSeed(data, width, x, y) {
  const s = (y * width + x) * 4;
  const [r, g, b, a] = [data[s], data[s + 1], data[s + 2], data[s + 3]];
  const like = new Uint8Array(data.length / 4);
  for (let i = 0, p = 0; p < like.length; i += 4, p++) {
    if (a < 60) like[p] = data[i + 3] < 70 ? 1 : 0;
    else like[p] = data[i + 3] > 120 && Math.abs(data[i] - r) + Math.abs(data[i + 1] - g) + Math.abs(data[i + 2] - b) < 90 ? 1 : 0;
  }
  return like;
}

/** Keeps a pixel only if every pixel within `r` (a square) is kept too: shrinks an area by r on every side. */
function shrink(open, width, height, r) {
  const across = new Uint8Array(open.length);
  for (let y = 0; y < height; y++) {
    let run = 0;
    for (let x = 0; x < width; x++) {
      run = open[y * width + x] ? run + 1 : 0;
      if (run > 2 * r) across[y * width + x - r] = 1;
    }
  }
  const both = new Uint8Array(open.length);
  for (let x = 0; x < width; x++) {
    let run = 0;
    for (let y = 0; y < height; y++) {
      run = across[y * width + x] ? run + 1 : 0;
      if (run > 2 * r) both[(y - r) * width + x] = 1;
    }
  }
  return both;
}

/** Grows an area by r on every side (a square), but only into `allowed` pixels. */
function grow(area, allowed, width, height, r) {
  const across = new Uint8Array(area.length);
  for (let y = 0; y < height; y++) {
    let last = -Infinity;
    for (let x = 0; x < width; x++) {
      if (area[y * width + x]) last = x;
      if (x - last <= r) across[y * width + x] = 1;
    }
    last = Infinity;
    for (let x = width - 1; x >= 0; x--) {
      if (area[y * width + x]) last = x;
      if (last - x <= r) across[y * width + x] = 1;
    }
  }
  const out = new Uint8Array(area.length);
  for (let x = 0; x < width; x++) {
    let last = -Infinity;
    for (let y = 0; y < height; y++) {
      if (across[y * width + x]) last = y;
      if (y - last <= r) out[y * width + x] = 1;
    }
    last = Infinity;
    for (let y = height - 1; y >= 0; y--) {
      if (across[y * width + x]) last = y;
      if (last - y <= r) out[y * width + x] = 1;
    }
  }
  for (let p = 0; p < out.length; p++) out[p] = out[p] && (allowed[p] || area[p]) ? 1 : 0;
  return out;
}

/** The pixels the bucket fills from (x, y) on a canvas, as a mask canvas (opaque where it fills), or null. */
export function fillMask(canvas, x, y) {
  const { width, height } = canvas;
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= width || y >= height) return null;
  const { data } = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, width, height);
  const like = likeSeed(data, width, x, y);
  let open = shrink(like, width, height, GAP);
  if (!open[y * width + x]) open = like; // tapped right next to a line: fill what's there
  const area = new Uint8Array(like.length);
  const stack = [y * width + x];
  area[stack[0]] = 1;
  while (stack.length) {
    const p = stack.pop();
    const px = p % width;
    for (const q of [px > 0 ? p - 1 : -1, px < width - 1 ? p + 1 : -1, p - width, p + width]) {
      if (q >= 0 && q < area.length && !area[q] && open[q]) {
        area[q] = 1;
        stack.push(q);
      }
    }
  }
  const filled = grow(area, like, width, height, GAP + 1);
  const mask = document.createElement('canvas');
  mask.width = width;
  mask.height = height;
  const m = mask.getContext('2d');
  const image = m.createImageData(width, height);
  for (let p = 0; p < filled.length; p++) if (filled[p]) image.data[p * 4 + 3] = 255;
  m.putImageData(image, 0, 0);
  return mask;
}
