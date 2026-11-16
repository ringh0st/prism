import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { totalStars } from '../../game/progress.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './CurrencyHud.module.css';

/** Rewards arriving fly in first (rewardFlight.js), so a rising number waits a moment, then rolls up to the new one. */
const ROLL_DELAY = 1000;
const ROLL_TIME = 800;

function useRollingNumber(value) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  shownRef.current = shown;
  useEffect(() => {
    const from = shownRef.current;
    if (value <= from || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      return undefined;
    }
    const steps = Math.min(value - from, 12);
    const timers = Array.from({ length: steps }, (_, i) =>
      setTimeout(() => setShown(Math.round(from + ((value - from) * (i + 1)) / steps)), ROLL_DELAY + (ROLL_TIME * (i + 1)) / steps),
    );
    return () => timers.forEach(clearTimeout);
  }, [value]);
  return shown;
}

function Counter({ icon, value, label, tone }) {
  const shown = useRollingNumber(value);
  return (
    <span className={`${styles.counter} ${styles[tone]}`} data-counter={icon}>
      <span className={styles.badge} aria-hidden="true">
        <Icon name={icon} size={18} />
      </span>
      <span className={styles.value} key={shown} aria-hidden="true">
        {shown}
      </span>
      <span className="visually-hidden">{`${value} ${label}`}</span>
    </span>
  );
}

/** Game-style currency counters. The whole strip opens the store. */
export default function CurrencyHud({ showStars = true }) {
  const { progress } = usePlayer();
  const { t } = useI18n();
  return (
    <a href="#/store" className={styles.hud} aria-label={t('ui.hud.open')}>
      {showStars && <Counter icon="star" value={totalStars(progress)} label={t('ui.hud.stars')} tone="star" />}
      <Counter icon="spark" value={progress.sparks} label={t('ui.hud.sparks')} tone="spark" />
      <Counter icon="diamond" value={progress.diamonds} label={t('ui.hud.diamonds')} tone="diamond" />
      <span className={styles.plus} aria-hidden="true">
        <Icon name="plus" size={16} strokeWidth={3.4} />
      </span>
    </a>
  );
}
