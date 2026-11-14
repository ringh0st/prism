import { useEffect, useRef } from 'react';
import Icon from '../../components/Icon.jsx';
import { PLAYER_TITLES, titleFor } from '../../game/titles.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './TitleRoad.module.css';

/** Every title on one road, as badges: earned ones wear a ✓, the current one shines, later ones show the ★ they need. */
export default function TitleRoad({ stars }) {
  const { t } = useI18n();
  const { current } = titleFor(stars);
  const currentIndex = PLAYER_TITLES.indexOf(current);
  const stepsRef = useRef(null);

  // Open with the current stop in the middle of the road.
  useEffect(() => {
    const steps = stepsRef.current;
    const stop = steps?.children[currentIndex];
    if (stop) steps.scrollLeft = stop.offsetLeft - (steps.clientWidth - stop.clientWidth) / 2;
  }, [currentIndex]);
  return (
    <section className={styles.road} aria-label={t('me.road.title')}>
      <ol ref={stepsRef} className={styles.steps} tabIndex={0} aria-label={t('me.road.title')}>
        {PLAYER_TITLES.map((title, i) => {
          const state = i < currentIndex ? 'earned' : i === currentIndex ? 'current' : 'ahead';
          return (
            <li key={title.name} className={`${styles.step} ${styles[state]}`} aria-current={state === 'current' ? 'step' : undefined}>
              <span className={`${styles.dot} ${styles[title.tone]}`} aria-hidden="true">
                <Icon name={state === 'ahead' ? 'lock' : state === 'earned' ? 'check' : 'star'} size={16} />
              </span>
              <span className={styles.name}>{t(`title.${title.tone}`, {}, title.name)}</span>
              {state === 'ahead' && (
                <span className={`game-title ${styles.need}`} aria-hidden="true">
                  <Icon name="star" size={11} />
                  {title.stars}
                </span>
              )}
              <span className="visually-hidden">
                {state === 'earned' ? t('me.road.earned') : state === 'current' ? t('me.road.here') : t('me.road.more', { n: title.stars - stars })}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
