import styles from './GiftBoxArt.module.css';

const TONES = {
  honey: { box: '#f0c14e', shade: '#d9a73a', ribbon: '#df7458' },
  peach: { box: '#f2a67e', shade: '#d98a62', ribbon: '#58ac82' },
  mint: { box: '#4fbfad', shade: '#3a9e8e', ribbon: '#f0c14e' },
};

/**
 * A wrapped present (inline SVG). `phase` wrapped | shaking | open: it wobbles, then the lid pops off.
 * Decorative: the dialog around it says what it is.
 */
export default function GiftBoxArt({ tone = 'honey', phase = 'wrapped', size = 120, isBig = false }) {
  const colors = TONES[tone];
  return (
    <svg
      className={`${styles.art} ${styles[phase]} ${isBig ? styles.big : ''}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="60" cy="112" rx="38" ry="6" fill="rgba(60, 40, 20, 0.16)" />
      <g className={styles.body}>
        <rect x="22" y="52" width="76" height="58" rx="8" fill={colors.box} />
        <rect x="22" y="52" width="76" height="12" fill={colors.shade} opacity="0.5" />
        <rect x="53" y="52" width="14" height="58" fill={colors.ribbon} />
      </g>
      <g className={styles.lid}>
        <rect x="16" y="38" width="88" height="18" rx="6" fill={colors.box} />
        <rect x="53" y="38" width="14" height="18" fill={colors.ribbon} />
        <path d="M60 38c-6-14-26-18-24-6 1 6 14 7 24 6z" fill={colors.ribbon} />
        <path d="M60 38c6-14 26-18 24-6-1 6-14 7-24 6z" fill={colors.ribbon} />
        <circle cx="60" cy="37" r="5" fill={colors.shade} />
      </g>
      <g className={styles.glow}>
        <circle cx="60" cy="50" r="30" fill="#ffe9a8" opacity="0.7" />
      </g>
    </svg>
  );
}
