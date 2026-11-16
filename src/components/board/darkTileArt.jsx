/*
 * Art for the darkness (src/game/darkness.js), in the board's 100×100 tile units: Smudge the creeping shadow, the
 * void, the eclipse moon, and the countdown badge on fading gems and dying lamps. Smudge is cheeky rather than
 * scary: a soft cocoa-dark puff with honey eyes and a grin (no purple, no black).
 */
import styles from './Board.module.css';

/** Smudge, a creeping shadow: a wobbly smoke puff with glowing eyes. `isScared` when the light is close. */
export function SmudgeArt({ isScared = false }) {
  return (
    <g className={styles.smudge}>
      <ellipse cx="50" cy="56" rx="40" ry="34" fill="#3b2c24" opacity="0.28" />
      <path
        d="M18 70c-8-4-8-16 0-20-2-14 10-24 22-20 6-12 26-12 32 0 12-2 20 10 16 20 8 4 8 16 0 20-4 8-12 8-18 4-6 6-16 6-22 0-8 6-18 4-22-2-4 2-8 2-8-2z"
        fill="#4a3a30"
      />
      <path d="M26 46c4-8 14-12 22-8" fill="none" stroke="#6e5848" strokeWidth="4" strokeLinecap="round" />
      {/* Honey eyes (wide when the light is near), and a cheeky grin */}
      <ellipse cx="38" cy="54" rx="8" ry={isScared ? 10 : 7} fill="#f7d06a" />
      <ellipse cx="62" cy="54" rx="8" ry={isScared ? 10 : 7} fill="#f7d06a" />
      <circle cx={isScared ? 38 : 40} cy="55" r="3.6" fill="#2b2118" />
      <circle cx={isScared ? 62 : 64} cy="55" r="3.6" fill="#2b2118" />
      {isScared ? (
        <ellipse cx="50" cy="71" rx="5" ry="4" fill="#2b2118" />
      ) : (
        <path d="M40 68q10 8 20 0" fill="none" stroke="#f2a67e" strokeWidth="3.5" strokeLinecap="round" />
      )}
    </g>
  );
}

/** A void: a dark whirl that swallows light passing next to it. */
export function VoidArt() {
  return (
    <g className={styles.void}>
      <circle cx="50" cy="50" r="40" fill="#2f2620" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#f0c14e" strokeWidth="2.5" strokeDasharray="4 7" opacity="0.7" />
      <g className={styles.voidSwirl}>
        <path d="M50 22a28 28 0 0 1 26 30M50 78a28 28 0 0 1-26-30" fill="none" stroke="#6e5848" strokeWidth="6" strokeLinecap="round" />
        <path d="M50 34a16 16 0 0 1 15 18M50 66a16 16 0 0 1-15-18" fill="none" stroke="#8a705c" strokeWidth="5" strokeLinecap="round" />
      </g>
      <circle cx="50" cy="50" r="7" fill="#1c1611" />
    </g>
  );
}

/** The eclipse: a sun with a moon sliding across it. */
export function EclipseArt() {
  return (
    <g>
      <circle cx="50" cy="50" r="34" fill="#f0c14e" />
      <circle cx="62" cy="44" r="30" fill="#4a3a30" />
      <path d="M22 50h-12M50 22V10M30 30l-8-8M30 70l-8 8" stroke="#f0c14e" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

/**
 * A countdown on a fading gem or a dying lamp: moves left in a little dark bubble at the top corner, warm when
 * it's getting close.
 */
export function DarkCounter({ value }) {
  const isClose = value <= 1;
  return (
    <g className={isClose ? styles.counterClose : undefined}>
      <circle cx="78" cy="22" r="17" fill={isClose ? '#df7458' : '#4a3a30'} stroke="#fffaf2" strokeWidth="3.5" />
      <text x="78" y="29.5" textAnchor="middle" fontSize="21" fontWeight="800" fill="#fffaf2" fontFamily="var(--font-display)">
        {value}
      </text>
    </g>
  );
}

/** A gem the darkness took: grey and cracked. */
export function DarkenedGem() {
  return (
    <g>
      <circle cx="50" cy="50" r="30" fill="#6e6259" />
      <path d="M38 34l10 14-6 6 12 12M62 32l-8 12" fill="none" stroke="#3b302a" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  );
}
