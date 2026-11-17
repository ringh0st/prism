/**
 * The world's board colors as plain colors (the theme mixes them with color-mix(), which three.js can't read), by
 * painting each onto a 1-pixel canvas and reading it back.
 */
const FALLBACK = { board: '#c6d9b4', cell: '#f3f6ea', cellAlt: '#e2ecd8' };

export function resolveWorldTheme(element) {
  const probe = document.createElement('span');
  element.appendChild(probe);
  const pixel = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const resolve = (name, fallback) => {
    probe.style.color = `var(${name}, ${fallback})`;
    pixel.clearRect(0, 0, 1, 1);
    pixel.fillStyle = getComputedStyle(probe).color;
    pixel.fillRect(0, 0, 1, 1);
    const [r, g, b] = pixel.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
  };
  const theme = {
    board: resolve('--surface-board', FALLBACK.board),
    cell: resolve('--surface-cell', FALLBACK.cell),
    cellAlt: resolve('--surface-cell-alt', FALLBACK.cellAlt),
  };
  probe.remove();
  return theme;
}
