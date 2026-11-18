import GemShape from '../GemShape.jsx';
import { BEAM_COLORS } from '../../game/constants.js';
import { useIsRescue } from '../../i18n/I18nContext.jsx';

/** Each light's Lumi tones: body and the glowing tail. */
const LUMI_TONES = {
  sun: ['#f9c46b', '#ffb81f'],
  coral: ['#f6a08f', '#ff6a55'],
  lime: ['#a8d98c', '#58c94a'],
  sky: ['#9fd0ee', '#3aaeea'],
};
/** The color's shape on the antenna tips (so color is never the only clue). */
const TIP_PATHS = {
  diamond: 'M0-4 3 0 0 4-3 0Z',
  circle: 'M-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0Z',
  triangle: 'M0-3.6 3.4 2.6H-3.4Z',
  square: 'M-2.8-2.8H2.8V2.8H-2.8Z',
};
const INK = '#3b1a08';

/** A little Lumi face in a light's color, with that color's shape on its antennae. */
function LumiFace({ color, coat, size }) {
  // Its own pastel coat when it has one (a deeper shade of it for the tail), else its light's tones.
  const [body, glow] = coat ? [coat, `color-mix(in srgb, ${coat} 70%, #b0306a)`] : (LUMI_TONES[color] ?? LUMI_TONES.sun);
  const tip = TIP_PATHS[BEAM_COLORS[color]?.shape ?? 'diamond'];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      {[-1, 1].map((side) => (
        <g key={side}>
          <path d={`M${20 + side * 4} 12 ${20 + side * 8} 5`} stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
          <path d={tip} transform={`translate(${20 + side * 8} 5)`} fill={glow} stroke={INK} strokeWidth="0.8" />
        </g>
      ))}
      <ellipse cx="20" cy="33" rx="7" ry="4.5" fill={glow} />
      <circle cx="20" cy="21" r="12" fill={body} stroke={INK} strokeWidth="1.4" />
      <circle cx="15.5" cy="20" r="2.2" fill={INK} />
      <circle cx="24.5" cy="20" r="2.2" fill={INK} />
      <circle cx="16.2" cy="19.2" r="0.8" fill="#fff" />
      <circle cx="25.2" cy="19.2" r="0.8" fill="#fff" />
      <circle cx="12.5" cy="24" r="2" fill="#ff8a7a" opacity="0.7" />
      <circle cx="27.5" cy="24" r="2" fill="#ff8a7a" opacity="0.7" />
      <path d="M17.5 25.2q2.5 2.4 5 0" stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** What a level asks you to light: a gem, or in themed worlds the Lumi waiting to be saved (in its coat). */
export default function TargetIcon({ color, coat = null, size }) {
  return useIsRescue() ? <LumiFace color={color} coat={coat} size={size} /> : <GemShape color={color} size={size} />;
}
