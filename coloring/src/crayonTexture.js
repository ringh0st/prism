/**
 * Makes a line look like wax crayon, not a marker: each color is painted through a small tile of that color with
 * paper showing through in fine speckles and streaks (made once per color and kept).
 */
const tiles = new Map();

export function crayonPaint(context, color) {
  if (!tiles.has(color)) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 96;
    const t = tile.getContext('2d');
    t.fillStyle = color;
    t.fillRect(0, 0, 96, 96);
    t.globalCompositeOperation = 'destination-out';
    // Seeded, so the same color always has the same grain.
    let seed = [...color].reduce((sum, ch) => sum * 31 + ch.charCodeAt(0), 7) % 2147483647;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 520; i++) {
      t.globalAlpha = 0.25 + random() * 0.6;
      t.fillRect(random() * 96, random() * 96, 1 + random() * 1.6, 1 + random() * 1.2);
    }
    t.globalAlpha = 0.16;
    t.lineWidth = 1;
    for (let i = 0; i < 26; i++) {
      const x = random() * 96;
      const y = random() * 96;
      t.beginPath();
      t.moveTo(x, y);
      t.lineTo(x + 10 + random() * 14, y - 5 - random() * 6);
      t.stroke();
    }
    tiles.set(color, tile);
  }
  return context.createPattern(tiles.get(color), 'repeat');
}
