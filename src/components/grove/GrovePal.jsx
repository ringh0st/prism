import { useEffect, useState } from 'react';
import PalArt from '../pals/PalArt.jsx';
import { usePalLife } from '../../hooks/usePalLife.js';
import { palById, palStage } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import styles from './GroveScene.module.css';

/**
 * One Pal living in the Grove: it wanders, visits decor, shows moods and naps at night. Tap to pet it.
 * `greeting` is said once when it appears (a celebration, say).
 */
export default function GrovePal({ palId, stage = 0, wearing = [], spots, isNapping = false, size = 30, start, petLines, greeting = null, label }) {
  const pal = palById(palId);
  const life = usePalLife({ spots, isNapping, start });
  const [pet, setPet] = useState(() => (greeting ? { line: greeting, key: 'greeting' } : null));

  useEffect(() => {
    if (!pet) return undefined;
    const timer = setTimeout(() => setPet(null), 2600);
    return () => clearTimeout(timer);
  }, [pet]);

  const petPal = () => {
    setPet({ line: isNapping ? 'Five more minutes…' : petLines[Date.now() % petLines.length], key: Date.now() });
    sfx.hello();
  };
  const talk = pet?.line ?? life.emote?.line;

  return (
    <button
      type="button"
      className={`${styles.pal} ${life.isWalking ? styles.walking : ''} ${life.place.left < 30 ? styles.nearLeft : life.place.left > 70 ? styles.nearRight : ''}`}
      style={{
        '--x': life.place.left,
        '--y': life.place.top,
        zIndex: Math.round(life.place.top),
        width: `${size}%`,
        transitionDuration: `${life.walkMs}ms`,
      }}
      onClick={petPal}
      aria-label={label ?? `Pet ${pal.name}, ${palStage(stage).name}${isNapping ? ' (napping)' : ''}`}
    >
      {/* A new key on every pet or action replays its animation (keys are prefixed so siblings never clash). */}
      <span
        key={`body-${pet?.key ?? life.action?.key ?? 'still'}`}
        className={`${styles.body} ${pet ? styles.hop : life.action ? styles[life.action.name] : ''}`}
        style={{ '--facing': life.facing }}
      >
        <PalArt palId={palId} stage={stage} wearing={wearing} size="100%" alive={!isNapping} />
      </span>
      {life.emote && !pet && (
        <span key={`emote-${life.emote.key}`} className={`${styles.emote} ${life.emote.symbol === 'z' ? styles.snore : ''}`} aria-hidden="true">
          {life.emote.symbol}
        </span>
      )}
      {pet && (
        <span key={`hearts-${pet.key}`} className={styles.hearts} aria-hidden="true">
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
        </span>
      )}
      {talk && (
        <span key={`talk-${talk}`} className={styles.bubble} role="status">
          {talk}
        </span>
      )}
    </button>
  );
}
