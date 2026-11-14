import { useEffect, useRef } from 'react';
import Icon from '../../components/Icon.jsx';
import { PLAYER_TITLES, titleFor } from '../../game/titles.js';
import styles from './TitleRoad.module.css';

/** Every title on one road: the ones earned (✓), the current one, and what each next one needs. */
export default function TitleRoad({ stars }) {
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
    <section className={styles.road} aria-labelledby="title-road">
      <h3 id="title-road" className={styles.heading}>
        Title road
      </h3>
      <ol ref={stepsRef} className={styles.steps}>
        {PLAYER_TITLES.map((title, i) => {
          const state = i < currentIndex ? 'earned' : i === currentIndex ? 'current' : 'ahead';
          return (
            <li key={title.name} className={`${styles.step} ${styles[state]}`} aria-current={state === 'current' ? 'step' : undefined}>
              <span className={`${styles.dot} ${styles[title.tone]}`} aria-hidden="true">
                <Icon name={state === 'ahead' ? 'lock' : state === 'earned' ? 'check' : 'star'} size={16} />
              </span>
              <span className={styles.name}>{title.name}</span>
              <span className={styles.need}>
                {state === 'earned' ? 'Earned' : state === 'current' ? 'You are here' : `${title.stars - stars} more ★`}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
