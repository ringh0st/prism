import { useEffect, useState } from 'react';
import PalArt from './PalArt.jsx';
import Icon from '../Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { useIsSplashShowing } from '../../state/SplashContext.jsx';
import { palById, stageOf } from '../../game/pals.js';
import { palGreetingFor } from '../../game/palGreetings.js';
import { todayKey } from '../../game/daily.js';
import { readJson, writeJson } from '../../lib/storage.js';
import styles from './PalHello.module.css';

const STORAGE_KEY = 'prism.palHello.v1';
const SHOW_MS = 7000;
const LEAVE_MS = 400;

/**
 * Pal of the day: the first time you open the map each day, your partner pops up beside PLAY, waves and
 * says something that fits (almost grown, an event weekend, your streak…). Tap it to visit your Pals.
 * `onHello` is called when it starts talking (so Lumi can stay quiet meanwhile).
 */
export default function PalHello({ onHello }) {
  const { progress } = usePlayer();
  const isSplashShowing = useIsSplashShowing();
  const partner = palById(progress.pal.id);
  const [line, setLine] = useState(null);
  const [phase, setPhase] = useState('waiting');

  // Says hello once the splash is gone, at most once a day.
  useEffect(() => {
    if (isSplashShowing || phase !== 'waiting') return;
    if (!partner || readJson(STORAGE_KEY, null) === todayKey()) {
      setPhase('gone');
      return;
    }
    writeJson(STORAGE_KEY, todayKey());
    setLine(palGreetingFor(progress));
    setPhase('in');
    onHello?.();
  }, [isSplashShowing, phase, partner, progress, onHello]);

  useEffect(() => {
    if (phase !== 'in') return undefined;
    const leave = setTimeout(() => setPhase('out'), SHOW_MS);
    return () => clearTimeout(leave);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'out') return undefined;
    const gone = setTimeout(() => setPhase('gone'), LEAVE_MS);
    return () => clearTimeout(gone);
  }, [phase]);

  if (phase === 'waiting' || phase === 'gone') return null;
  return (
    <div className={`${styles.hello} ${phase === 'out' ? styles.leaving : ''}`}>
      <a href="#/pals" className={styles.pal} aria-label={`${partner.name} says: ${line} Visit your Pals.`}>
        <PalArt palId={partner.id} stage={stageOf(progress.pal.owned[partner.id])} wearing={progress.pal.wearing} size={82} alive />
      </a>
      <p className={styles.bubble} role="status">
        <span className={styles.name}>{partner.name}</span> {line}
      </p>
      <button type="button" className={styles.close} onClick={() => setPhase('out')} aria-label="Close">
        <Icon name="close" size={14} strokeWidth={3} />
      </button>
    </div>
  );
}
