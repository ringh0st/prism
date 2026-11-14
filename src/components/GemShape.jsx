import { BEAM_COLORS } from '../game/constants.js';

/** SVG paths (viewBox 0 0 100 100) for each color's shape, so color is never the only cue. */
const SHAPES = {
  diamond: 'M50 12 L86 50 L50 88 L14 50 Z',
  circle: 'M50 14 A36 36 0 1 1 49.9 14 Z',
  triangle: 'M50 12 L88 82 L12 82 Z',
  square: 'M18 18 H82 V82 H18 Z',
};

export const beamColorVar = (color) => `var(--beam-${color})`;

export function shapePathFor(color) {
  return SHAPES[BEAM_COLORS[color]?.shape ?? 'diamond'];
}

/** Standalone gem icon for legends and the editor palette. */
export default function GemShape({ color, size = 18, label }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={shapePathFor(color)} fill={beamColorVar(color)} stroke="rgba(0,0,0,.25)" strokeWidth="6" strokeLinejoin="round" />
      <path d={shapePathFor(color)} fill="#fff" opacity=".35" transform="translate(50 50) scale(.45) translate(-50 -58)" />
    </svg>
  );
}
