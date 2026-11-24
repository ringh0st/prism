import { store } from './storage.js';

/**
 * Day and night (owner: "a night switch button, the same as the other apps"). Night darkens the desk, the walls
 * and the buttons under a softer lamp; the paper stays light so colors look true. It starts from the device's own
 * setting and remembers the child's choice.
 */
const BAR_COLORS = { day: '#E9D3B0', night: '#2a1f17' };
const deviceTheme = () => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'night' : 'day');

export const currentTheme = () => store.get('coloring.theme', null) ?? deviceTheme();

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) meta.setAttribute('content', BAR_COLORS[theme]);
}

export function saveTheme(theme) {
  store.set('coloring.theme', theme);
  applyTheme(theme);
}
