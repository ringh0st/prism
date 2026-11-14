import { useId } from 'react';
import styles from './Lumi.module.css';

const EYES = {
  happy: (
    <>
      <ellipse cx="38" cy="54" rx="6" ry="8" fill="#3b1a08" />
      <ellipse cx="62" cy="54" rx="6" ry="8" fill="#3b1a08" />
      <circle cx="40" cy="51" r="2.4" fill="#fff" />
      <circle cx="64" cy="51" r="2.4" fill="#fff" />
    </>
  ),
  excited: (
    <>
      <path d="M31 56 38 47 45 56" fill="none" stroke="#3b1a08" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M55 56 62 47 69 56" fill="none" stroke="#3b1a08" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  worried: (
    <>
      <ellipse cx="38" cy="56" rx="6.5" ry="7.5" fill="#3b1a08" />
      <ellipse cx="62" cy="56" rx="6.5" ry="7.5" fill="#3b1a08" />
      <path d="M29 44 44 47M71 44 56 47" stroke="#3b1a08" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  sad: (
    <>
      <path d="M31 55q7 6 14 0M55 55q7 6 14 0" fill="none" stroke="#3b1a08" strokeWidth="5" strokeLinecap="round" />
      <path d="M70 60q3 7 0 10q-3-3 0-10z" fill="#7cd3ff" />
    </>
  ),
  sleepy: (
    <path d="M31 56h14M55 56h14" stroke="#3b1a08" strokeWidth="5" strokeLinecap="round" />
  ),
};

const MOUTHS = {
  happy: <path d="M41 66q9 9 18 0" fill="none" stroke="#3b1a08" strokeWidth="5" strokeLinecap="round" />,
  excited: <path d="M38 64q12 18 24 0z" fill="#3b1a08" />,
  worried: <ellipse cx="50" cy="70" rx="5" ry="6" fill="#3b1a08" />,
  sad: <path d="M42 72q8-7 16 0" fill="none" stroke="#3b1a08" strokeWidth="5" strokeLinecap="round" />,
  sleepy: <ellipse cx="50" cy="69" rx="4" ry="3" fill="#3b1a08" />,
};

/**
 * Lumi, Prism's mascot: a little firefly whose glowing tail is the light you bend.
 * mood: happy | excited | worried | sad | sleepy | dance
 */
export default function Lumi({ mood = 'happy', size = 72, line, bubbleSide = 'right', className = '' }) {
  const face = mood === 'dance' ? 'excited' : mood;
  const clipId = `lumi-head-${useId().replace(/:/g, '')}`;
  return (
    <div className={`${styles.lumi} ${styles[mood] ?? ''} ${className}`} style={{ '--size': `${size}px` }}>
      <svg viewBox="0 0 100 110" width={size} height={size * 1.1} className={styles.body} aria-hidden="true">
        <ellipse cx="50" cy="105" rx="22" ry="4" fill="rgba(120,70,20,.2)" className={styles.shadow} />
        {/* little light rays when excited */}
        <g className={styles.rays} stroke="#ffe27a" strokeWidth="5" strokeLinecap="round">
          <path d="M14 30l6 6M86 30l-6 6M4 64h8M88 64h8" />
        </g>
        {/* wings */}
        <g className={styles.wingLeft}>
          <ellipse cx="22" cy="44" rx="20" ry="12" fill="#cfe9e2" opacity=".95" transform="rotate(-28 22 44)" />
          <ellipse cx="22" cy="44" rx="11" ry="5" fill="#fff" opacity=".7" transform="rotate(-28 22 44)" />
        </g>
        <g className={styles.wingRight}>
          <ellipse cx="78" cy="44" rx="20" ry="12" fill="#cfe9e2" opacity=".95" transform="rotate(28 78 44)" />
          <ellipse cx="78" cy="44" rx="11" ry="5" fill="#fff" opacity=".7" transform="rotate(28 78 44)" />
        </g>
        {/* antennae */}
        <path d="M42 32Q36 16 28 12M58 32Q64 16 72 12" stroke="#7d6e63" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <circle cx="27" cy="11" r="5.5" fill="#ffd45e" />
        <circle cx="73" cy="11" r="5.5" fill="#ffd45e" />
        {/* the glowing tail */}
        <circle cx="50" cy="92" r="20" fill="#ffe27a" opacity=".45" className={styles.glow} />
        <ellipse cx="50" cy="92" rx="18" ry="12" fill="#ffd45e" />
        <ellipse cx="44" cy="88" rx="6" ry="3" fill="#fff6c9" />
        {/* head */}
        <circle cx="50" cy="58" r="30" fill="#f2a67e" />
        {/* soft light on the upper left, kept inside the round head */}
        <g clipPath={`url(#${clipId})`}>
          <circle cx="38" cy="46" r="24" fill="#f8b991" />
        </g>
        <clipPath id={clipId}>
          <circle cx="50" cy="58" r="30" />
        </clipPath>
        <ellipse cx="36" cy="38" rx="7" ry="4" fill="#fff" opacity=".55" transform="rotate(-30 36 38)" />
        <ellipse cx="29" cy="68" rx="6.5" ry="4" fill="#ff7a6a" opacity=".55" />
        <ellipse cx="71" cy="68" rx="6.5" ry="4" fill="#ff7a6a" opacity=".55" />
        <g className={face === 'happy' ? styles.blink : undefined}>{EYES[face]}</g>
        {MOUTHS[face]}
        {mood === 'sleepy' && (
          <text x="80" y="30" fontSize="20" fontWeight="800" fill="#7a6152" fontFamily="var(--font-display)" className={styles.zzz}>
            z
          </text>
        )}
      </svg>
      {line && (
        <p className={`${styles.bubble} ${styles[bubbleSide]}`} key={line} role="status" aria-live="polite">
          {line}
        </p>
      )}
    </div>
  );
}
