import { useEffect, useRef, useState } from 'react';
import PalArt from './PalArt.jsx';
import RarityBadge from './RarityBadge.jsx';
import { gemBurst } from '../../lib/effects.js';
import { sfx } from '../../audio/sfx.js';
import styles from './PalReveal.module.css';

const SILHOUETTE_MS = 650;
const FILL_MS = 700;
const prefersCalm = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Meeting a new Pal: a dark silhouette, a beam of light sweeps across and fills it in, then the Pal pops out
 * with a chirp and a burst (and its ★ Legendary / ✦ Mythic stamp). Shown at once for reduced motion.
 */
export default function PalReveal({ pal, size = 140, label }) {
  const [phase, setPhase] = useState(() => (prefersCalm() ? 'shown' : 'shadow')); // shadow | filling | shown
  const artRef = useRef(null);

  useEffect(() => {
    if (phase !== 'shadow') return undefined;
    const timers = [
      setTimeout(() => {
        setPhase('filling');
        sfx.palFill();
      }, SILHOUETTE_MS),
      setTimeout(() => {
        setPhase('shown');
        sfx.newPal();
        gemBurst(artRef.current, null);
      }, SILHOUETTE_MS + FILL_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- plays once

  return (
    <div className={styles.reveal}>
      <div ref={artRef} className={`${styles.art} ${styles[phase]}`}>
        <PalArt palId={pal.id} size={size} alive={phase === 'shown'} label={label} />
        <span className={styles.beam} aria-hidden="true" />
      </div>
      {phase === 'shown' && <RarityBadge pal={pal} className={styles.stamp} />}
    </div>
  );
}
