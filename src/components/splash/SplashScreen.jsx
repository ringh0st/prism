import { useEffect, useRef, useState } from 'react';
import Lumi from '../game/Lumi.jsx';
import { APP_VERSION, COPYRIGHT_YEAR, GAME_NAME, STUDIO_NAME } from '../../lib/appInfo.js';
import styles from './SplashScreen.module.css';

const SPLASH_MS = 4000;
const FADE_MS = 450;
const LINES = ['Waking up the gems…', 'Polishing mirrors…', 'Warming up the light…', 'Calling the Pals…'];
const TITLE_COLORS = ['#58AC82', '#E59A62', '#D9A23A', '#4FBFAD', '#DF7458', '#58AC82', '#E59A62', '#D9A23A'];

/**
 * The opening screen: Lumi flies in, a beam of light bounces off a mirror and lights a gem, the title
 * pops in, and a bar fills for 4 seconds while the game loads underneath. Shows the studio and version.
 * Tap, Enter or Escape skips it.
 */
export default function SplashScreen({ onDone }) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const splashRef = useRef(null);

  useEffect(() => {
    const leave = setTimeout(() => setIsLeaving(true), SPLASH_MS);
    const lines = setInterval(() => setLineIndex((i) => (i + 1) % LINES.length), SPLASH_MS / LINES.length);
    // Focus the splash itself (not the skip button) so Enter or Escape skips it without showing a focus ring.
    splashRef.current?.focus({ preventScroll: true });
    return () => {
      clearTimeout(leave);
      clearInterval(lines);
    };
  }, []);

  useEffect(() => {
    if (!isLeaving) return undefined;
    const done = setTimeout(onDone, FADE_MS);
    return () => clearTimeout(done);
  }, [isLeaving, onDone]);

  const skip = () => setIsLeaving(true);

  return (
    <div
      className={`${styles.splash} ${isLeaving ? styles.leaving : ''}`}
      ref={splashRef}
      tabIndex={-1}
      onClick={skip}
      onKeyDown={(event) => (event.key === 'Enter' || event.key === 'Escape' || event.key === ' ') && skip()}
      role="dialog"
      aria-modal="true"
      aria-label={`${GAME_NAME}, by ${STUDIO_NAME}. Version ${APP_VERSION}. Loading.`}
    >
      <div className={styles.rays} aria-hidden="true" />

      <div className={styles.stage} aria-hidden="true">
        <svg className={styles.beamArt} viewBox="0 0 200 120" focusable="false">
          {/* The light leaves Lumi, bounces off the mirror and lights the gem */}
          <path className={styles.beam} d="M100 112V40H170" pathLength="1" />
          <g className={styles.mirror} transform="translate(100 40) rotate(45)">
            <rect x="-15" y="-3.5" width="30" height="7" rx="3.5" fill="#5e5047" />
            <rect x="-13" y="-1.5" width="26" height="2.2" rx="1.1" fill="#fff6e0" />
          </g>
          <g className={styles.gem} transform="translate(176 40)">
            <circle className={styles.gemGlow} r="18" fill="#ffe27a" />
            <path d="M0-12L12 0 0 12-12 0z" fill="#f0c14e" />
            <path d="M0-12L5-1-0 0-12 0z" fill="#fff6c9" opacity="0.8" />
          </g>
        </svg>
        <div className={styles.lumi}>
          <Lumi mood="excited" size={118} />
        </div>
      </div>

      <h1 className={styles.title} aria-hidden="true">
        <span className={styles.rinny}>Rinny’s</span>
        <span className={styles.word}>
          {[...GAME_NAME].map((letter, i) => (
            <span key={i} className={styles.letter} style={{ '--i': i, color: TITLE_COLORS[i % TITLE_COLORS.length] }}>
              {letter}
            </span>
          ))}
        </span>
        <span className={styles.subtitle}>Light Puzzle</span>
      </h1>

      <div className={styles.loading} aria-hidden="true">
        <div className={styles.bar}>
          <span className={styles.fill} style={{ animationDuration: `${SPLASH_MS}ms` }} />
        </div>
        <p key={lineIndex} className={styles.line}>
          {LINES[lineIndex]}
        </p>
      </div>

      <footer className={styles.footer}>
        <p className={styles.studio}>
          A <strong>{STUDIO_NAME}</strong> production
        </p>
        <p className={styles.meta}>
          Version {APP_VERSION} · © {COPYRIGHT_YEAR} {STUDIO_NAME}
        </p>
      </footer>

      <button type="button" className={styles.skip} onClick={skip}>
        Tap to skip
      </button>
    </div>
  );
}
