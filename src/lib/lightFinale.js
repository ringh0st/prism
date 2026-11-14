import { flyToCounter, gemBurst } from './effects.js';

const MAX_BURSTS = 8;
const GAP_MS = 220;
const FLIGHT_MS = 620;

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
 * The light finale after a win: each move left over flies out of the moves counter as a spark and bursts
 * somewhere along the winning light path, one after another, each with a higher chime (`onBurst(i)`, also used
 * to count the counter down). Returns how long it takes (ms), so the result can wait for it. Nothing is paid for
 * it: it celebrates the moves the player didn't need, without a word.
 */
export function playLightFinale({ segments, width, movesLeft, onBurst }) {
  const cells = cellsAlongBeams(segments).filter(({ x, y }) => x >= 0 && y >= 0 && x < width);
  const count = Math.min(MAX_BURSTS, movesLeft);
  if (!cells.length || count < 1) return 0;
  const colors = ['#F0C14E', '#F2A67E', '#4FBFAD', '#58AC82'];
  const counter = document.querySelector('[data-moves-left]');
  for (let i = 0; i < count; i++) {
    setTimeout(
      () => {
        const { x, y } = cells[Math.floor(((i + 1) * cells.length) / (count + 1))];
        const cell = document.querySelector(`[data-cell="${y * width + x}"]`);
        const color = colors[i % colors.length];
        onBurst?.(i);
        flyToCounter(counter, cell, color, () => gemBurst(cell, color));
      },
      350 + i * GAP_MS,
    );
  }
  return 350 + count * GAP_MS + FLIGHT_MS;
}
