import { useEffect, useState } from 'react';
import PalArt from '../pals/PalArt.jsx';
import { usePalLife } from '../../hooks/usePalLife.js';
import { palById, palStage } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './GroveScene.module.css';

/**
 * One Pal living in the Grove: it wanders, visits decor, shows moods and naps at night. Tap to pet it.
 * `greeting` is said once when it appears (a celebration, say). `petLines` are its English lines when tapped,
 * `petLinesKey` their translations.
 */
export default function GrovePal({
  palId,
  stage = 0,
  wearing = [],
  spots,
  isNapping = false,
  size = 22,
  start,
  petLines,
  petLinesKey,
  greeting = null,
  label,
}) {
  const { t, line } = useI18n();
  const pal = palById(palId);
  const life = usePalLife({ spots, isNapping, start });
  const [pet, setPet] = useState(() => (greeting ? { line: greeting, key: 'greeting' } : null));

  useEffect(() => {
    if (!pet) return undefined;
    const timer = setTimeout(() => setPet(null), 2600);
    return () => clearTimeout(timer);
  }, [pet]);

  const petPal = () => {
    setPet({ line: isNapping ? t('grove.sleepy') : line(petLinesKey, petLines), key: Date.now() });
    sfx.hello();
  };
  const visitLine = life.emote?.line && t(`grove.visit.${life.emote.spot}`, {}, life.emote.line);
  const talk = pet?.line ?? visitLine;
  const palName = t(`palName.${pal.id}`, {}, pal.name);
  const stageName = t(`stage.${palStage(stage).id}`, {}, palStage(stage).name);

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
      aria-label={label ?? t(isNapping ? 'grove.petPalNapping' : 'grove.petPal', { name: palName, stage: stageName })}
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
