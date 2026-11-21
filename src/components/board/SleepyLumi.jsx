import { BEAM_COLORS } from '../../game/constants.js';
import { LUMI_INK as INK, TIP_PATHS, lumiTones } from '../game/lumiLook.js';
import styles from './Board.module.css';

/**
 * One of Lumi's family on the flat board (viewBox 0 0 100 100): asleep until the light reaches it, then awake and
 * glowing. It wears its own pastel coat, or its light's color with that color's shape on its antennae and tummy.
 */
export default function SleepyLumi({ color, coat, isLit }) {
  const [body, glow] = lumiTones(color, coat);
  const tip = TIP_PATHS[BEAM_COLORS[color]?.shape ?? 'diamond'];
  return (
    <g className={`${styles.lumi} ${isLit ? styles.lumiAwake : ''}`}>
      <g transform="translate(50 46) scale(1.22) translate(-50 -48)">
        {isLit && <circle cx="50" cy="46" r="30" fill={glow} filter="url(#tile-glow)" opacity="0.85" />}
        {[-1, 1].map((side) => (
          <g key={side}>
            <path d={`M${50 + side * 8} 28 ${50 + side * 16} ${isLit ? 13 : 17}`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
            <path d={tip} transform={`translate(${50 + side * 16} ${isLit ? 13 : 17}) scale(1.9)`} fill={glow} stroke={INK} strokeWidth="0.9" />
          </g>
        ))}
        <circle cx="50" cy="48" r="24" fill={body} stroke={INK} strokeWidth="2.6" />
        <circle cx="35" cy="54" r="4" fill="#ff8a7a" opacity="0.7" />
        <circle cx="65" cy="54" r="4" fill="#ff8a7a" opacity="0.7" />
        {isLit ? (
          <>
            <circle cx="41" cy="46" r="4.4" fill={INK} />
            <circle cx="59" cy="46" r="4.4" fill={INK} />
            <circle cx="42.4" cy="44.4" r="1.6" fill="#fff" />
            <circle cx="60.4" cy="44.4" r="1.6" fill="#fff" />
            <path d="M43 55q7 7 14 0" stroke={INK} strokeWidth="2.8" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M36 47q5 4 10 0M54 47q5 4 10 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M47 57q3 2 6 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <text x="78" y="26" fontSize="15" fontWeight="800" fill={INK} opacity="0.6" fontFamily="var(--font-display)">
              z
            </text>
          </>
        )}
        {/* A Lumi that needs a colored light shows that color's shape on its tummy too. */}
        {color !== 'sun' && <path d={tip} transform="translate(50 64) scale(1.7)" fill="#fff" stroke={INK} strokeWidth="0.8" />}
      </g>
    </g>
  );
}
