import { gemBurst } from './effects.js';

const MAX_BURSTS = 8;
const GAP_MS = 160;

/** Every board cell the light passes through, in order along the beams (segments go cell to cell in a straight line). */
export function cellsAlongBeams(segments) {
  const cells = [];
  const seen = new Set();
  for (const { x1, y1, x2, y2 } of segments) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= steps; i++) {
      const x = x1 + Math.sign(x2 - x1) * i;
      const y = y1 + Math.sign(y2 - y1) * i;
      const key = `${x},${y}`;
      if (!seen.has(key)) {
        seen.add(key);
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

/**
 * The light finale after a win: every move left over bursts somewhere along the winning light path,
 * one after another, each with a higher chime (`onBurst(i)`). Returns how long it takes (ms), so the
 * result can wait for it. Nothing is paid for it: it celebrates the moves the player didn't need.
 */
export function playLightFinale({ segments, width, movesLeft, onBurst }) {
  const cells = cellsAlongBeams(segments).filter(({ x, y }) => x >= 0 && y >= 0 && x < width);
  const count = Math.min(MAX_BURSTS, movesLeft);
  if (!cells.length || count < 1) return 0;
  const colors = ['#F0C14E', '#F2A67E', '#4FBFAD', '#58AC82'];
  for (let i = 0; i < count; i++) {
    setTimeout(
      () => {
        const { x, y } = cells[Math.floor(((i + 1) * cells.length) / (count + 1))];
        gemBurst(document.querySelector(`[data-cell="${y * width + x}"]`), colors[i % colors.length]);
        onBurst?.(i);
      },
      350 + i * GAP_MS,
    );
  }
  return 350 + count * GAP_MS;
}
