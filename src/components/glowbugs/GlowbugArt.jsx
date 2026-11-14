import { GLOWBUG_COLORS, glowbugById } from '../../game/glowbugs.js';
import styles from './GlowbugArt.module.css';

const INK = '#3B2A20';

/** Each kind's own features, drawn around a round body at (50, 56). */
const FEATURES = {
  firefly: ({ color }) => ({
    back: (
      <>
        <ellipse cx="30" cy="40" rx="14" ry="9" fill="#FFFFFF" opacity=".7" transform="rotate(-25 30 40)" />
        <ellipse cx="70" cy="40" rx="14" ry="9" fill="#FFFFFF" opacity=".7" transform="rotate(25 70 40)" />
      </>
    ),
    front: <ellipse cx="50" cy="80" rx="13" ry="8" fill={color.glow} />,
  }),
  beetle: ({ color }) => ({
    back: null,
    front: (
      <>
        <path d="M50 34v44" stroke={color.belly} strokeWidth="2.5" opacity=".7" />
        <circle cx="38" cy="66" r="3.5" fill={color.belly} />
        <circle cx="62" cy="66" r="3.5" fill={color.belly} />
        <path d="M42 30q-4-10-10-12M58 30q4-10 10-12" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    ),
  }),
  snail: ({ color }) => ({
    back: (
      <>
        <circle cx="68" cy="56" r="20" fill={color.belly} />
        <path d="M68 56m-8 0a8 8 0 1 0 8-8 12 12 0 1 1-12 12" stroke={color.body} strokeWidth="3" fill="none" />
      </>
    ),
    front: <path d="M40 30l-3-12M48 28l1-12" stroke={color.body} strokeWidth="3" strokeLinecap="round" />,
  }),
  sprout: () => ({
    back: null,
    front: (
      <>
        <path d="M50 32v-10" stroke="#5A9E6C" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 22c-8-6-14-2-14 2 6 2 10 1 14-2zM50 22c8-6 14-2 14 2-6 2-10 1-14-2z" fill="#7FBF8E" />
      </>
    ),
  }),
  bunny: ({ color }) => ({
    back: (
      <>
        <ellipse cx="40" cy="22" rx="6" ry="16" fill={color.body} transform="rotate(-10 40 22)" />
        <ellipse cx="60" cy="22" rx="6" ry="16" fill={color.body} transform="rotate(10 60 22)" />
        <ellipse cx="40" cy="22" rx="3" ry="11" fill={color.glow} transform="rotate(-10 40 22)" />
        <ellipse cx="60" cy="22" rx="3" ry="11" fill={color.glow} transform="rotate(10 60 22)" />
      </>
    ),
    front: null,
  }),
  shroom: ({ color }) => ({
    back: null,
    front: (
      <>
        <path d="M24 44c0-18 12-26 26-26s26 8 26 26c0 3-2 4-5 4H29c-3 0-5-1-5-4z" fill={color.body} />
        <circle cx="38" cy="32" r="4" fill="#FFF8EA" />
        <circle cx="58" cy="28" r="3" fill="#FFF8EA" />
        <circle cx="64" cy="40" r="3.5" fill="#FFF8EA" />
      </>
    ),
  }),
  moth: ({ color }) => ({
    back: (
      <>
        <path d="M34 50C12 34 8 60 22 66c6 2 12-4 12-16zM66 50c22-16 26 10 12 16-6 2-12-4-12-16z" fill={color.belly} />
        <circle cx="20" cy="54" r="4" fill={color.body} />
        <circle cx="80" cy="54" r="4" fill={color.body} />
      </>
    ),
    front: <path d="M44 30q-6-12-14-10M56 30q6-12 14-10" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />,
  }),
  jelly: ({ color }) => ({
    back: (
      <path
        d="M36 72q-2 10 2 16M44 74q0 10-3 16M56 74q0 10 3 16M64 72q2 10-2 16"
        stroke={color.body}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    ),
    front: null,
  }),
  starling: ({ color }) => ({
    back: <path d="M50 10l9 22 23 2-17 15 5 23-20-12-20 12 5-23-17-15 23-2z" fill={color.body} opacity=".85" />,
    front: <path d="M70 26l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" fill="#FFF8EA" />,
  }),
  puff: ({ color }) => ({
    back: (
      <>
        {[
          [30, 40],
          [70, 40],
          [26, 62],
          [74, 62],
          [40, 28],
          [60, 28],
          [50, 24],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="10" fill={color.belly} />
        ))}
      </>
    ),
    front: null,
  }),
  dragonling: ({ color }) => ({
    back: (
      <>
        <path d="M30 50L10 36l6 18zM70 50l20-14-6 18z" fill={color.body} opacity=".8" />
        <path d="M72 70q14 4 16-8" stroke={color.body} strokeWidth="6" fill="none" strokeLinecap="round" />
      </>
    ),
    front: (
      <>
        <path d="M40 32l-4-10 8 6zM60 32l4-10-8 6z" fill="#F0C14E" />
        <path d="M44 72h12" stroke={color.belly} strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  }),
  comet: ({ color }) => ({
    back: (
      <>
        <path d="M30 60C16 70 6 76 2 74c8-8 12-20 28-24z" fill={color.glow} />
        <path d="M30 52C20 50 10 46 6 40c10 0 20 2 26 8z" fill={color.belly} />
      </>
    ),
    front: <path d="M66 30l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" fill="#FFF8EA" />,
  }),
};

/**
 * A Glowbug: a round little critter with its kind's own features, in its color. Sleepy (eyes closed,
 * curled in a soft bubble) until light reaches it; awake, it smiles and glows.
 */
export default function GlowbugArt({ id, size = 64, isAwake = true, isSilhouette = false, className = '' }) {
  const bug = glowbugById(id);
  if (!bug) return null;
  const color = GLOWBUG_COLORS.find((c) => c.id === bug.color);
  const parts = FEATURES[bug.kind]({ color });
  const body =
    bug.kind === 'jelly' ? <path d="M28 66c0-24 10-36 22-36s22 12 22 36z" fill={color.body} /> : <circle cx="50" cy="56" r="22" fill={color.body} />;
  return (
    <svg
      className={`${styles.bug} ${isAwake ? styles.awake : styles.sleepy} ${isSilhouette ? styles.silhouette : ''} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <circle className={styles.glow} cx="50" cy="54" r="40" fill={color.glow} />
      {parts.back}
      {body}
      <ellipse cx="50" cy="64" rx="13" ry="9" fill={color.belly} />
      {parts.front}
      {isAwake ? (
        <>
          <circle cx="42" cy="54" r="3.6" fill={INK} />
          <circle cx="58" cy="54" r="3.6" fill={INK} />
          <circle cx="43.2" cy="52.6" r="1.2" fill="#FFFFFF" />
          <circle cx="59.2" cy="52.6" r="1.2" fill="#FFFFFF" />
          <path d="M46 61q4 4 8 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M38 55q4 3 8 0M54 55q4 3 8 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
          <text x="70" y="30" fontSize="14" fontWeight="800" fill={INK} opacity=".6" fontFamily="var(--font-display)">
            z
          </text>
        </>
      )}
      <circle cx="36" cy="61" r="3" fill="#F6A6A0" opacity=".7" />
      <circle cx="64" cy="61" r="3" fill="#F6A6A0" opacity=".7" />
    </svg>
  );
}
