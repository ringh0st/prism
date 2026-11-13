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
 * Lumi, Prism's mascot: a little drop of sunlight with opinions.
 * mood: happy | excited | worried | sad | sleepy | dance
 */
export default function Lumi({ mood = 'happy', size = 72, line, bubbleSide = 'right', className = '' }) {
  const face = mood === 'dance' ? 'excited' : mood;
  return (
    <div className={`${styles.lumi} ${styles[mood] ?? ''} ${className}`} style={{ '--size': `${size}px` }}>
      <svg viewBox="0 0 100 110" width={size} height={size * 1.1} className={styles.body} aria-hidden="true">
        <defs>
          <radialGradient id="lumi-body" cx="0.38" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#fffbe0" />
            <stop offset="0.45" stopColor="#ffd84a" />
            <stop offset="1" stopColor="#ff9a1c" />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="104" rx="24" ry="5" fill="rgba(165,70,25,.22)" className={styles.shadow} />
        {/* little light rays */}
        <g className={styles.rays} stroke="#ffe27a" strokeWidth="5" strokeLinecap="round">
          <path d="M50 4v8M14 22l6 6M86 22l-6 6M4 58h8M88 58h8" />
        </g>
        <path
          d="M50 14C72 30 88 46 88 64a38 38 0 0 1-76 0c0-18 16-34 38-50z"
          fill="url(#lumi-body)"
          stroke="#e8851a"
          strokeOpacity=".55"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <ellipse cx="34" cy="38" rx="9" ry="5" fill="#fff" opacity=".75" transform="rotate(-35 34 38)" />
        <ellipse cx="26" cy="68" rx="7" ry="4" fill="#ff7a6a" opacity=".55" />
        <ellipse cx="74" cy="68" rx="7" ry="4" fill="#ff7a6a" opacity=".55" />
        {EYES[face]}
        {MOUTHS[face]}
        {mood === 'sleepy' && (
          <text x="78" y="26" fontSize="20" fontWeight="800" fill="#7a6152" fontFamily="var(--font-display)" className={styles.zzz}>
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
