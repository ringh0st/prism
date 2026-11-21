// How a member of Lumi's family is colored and marked, shared by its icon (TargetIcon) and the board (SleepyLumi).

/** Each light's Lumi tones: body and the glowing tail. */
export const LUMI_TONES = {
  sun: ['#f9c46b', '#ffb81f'],
  coral: ['#f6a08f', '#ff6a55'],
  lime: ['#a8d98c', '#58c94a'],
  sky: ['#9fd0ee', '#3aaeea'],
};
/** The color's shape on the antenna tips (so color is never the only clue). */
export const TIP_PATHS = {
  diamond: 'M0-4 3 0 0 4-3 0Z',
  circle: 'M-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0Z',
  triangle: 'M0-3.6 3.4 2.6H-3.4Z',
  square: 'M-2.8-2.8H2.8V2.8H-2.8Z',
};
export const LUMI_INK = '#3b1a08';

/** Body and glow colors: its own pastel coat when it has one (a deeper shade of it for the glow), else its light's tones. */
export const lumiTones = (color, coat) => (coat ? [coat, `color-mix(in srgb, ${coat} 70%, #b0306a)`] : (LUMI_TONES[color] ?? LUMI_TONES.sun));
