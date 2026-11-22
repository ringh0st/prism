import { useEffect, useRef, useState } from 'react';
import Button from '../../components/Button.jsx';
import { TileDefs } from '../../components/board/TileArt.jsx';
import BoardDemo from './BoardDemo.jsx';
import StarsDemo from './StarsDemo.jsx';
import PalGrowDemo from './PalGrowDemo.jsx';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './WelcomeTour.module.css';

const TAP_LEVEL = {
  id: 'tour-tap',
  width: 3,
  height: 3,
  tiles: [
    { x: 0, y: 1, type: 'emitter', dir: 'right', color: 'sun' },
    { x: 1, y: 1, type: 'mirror', orient: 1 },
    { x: 1, y: 0, type: 'gem', color: 'sun' },
  ],
};

const GEMS_LEVEL = {
  id: 'tour-gems',
  width: 4,
  height: 4,
  tiles: [
    { x: 0, y: 1, type: 'emitter', dir: 'right', color: 'sun' },
    { x: 2, y: 1, type: 'mirror', orient: 1 },
    { x: 2, y: 0, type: 'gem', color: 'sun' },
    { x: 3, y: 3, type: 'emitter', dir: 'left', color: 'sun' },
    { x: 1, y: 3, type: 'mirror', orient: 0 },
    { x: 1, y: 2, type: 'gem', color: 'sun' },
  ],
};

/** The four pictures: each shows one idea, in a handful of words. Turn counts per frame drive the demos. */
const SLIDES = [
  {
    title: 'tour.tap',
    demo: (
      <BoardDemo
        level={TAP_LEVEL}
        frames={[
          [0, 1, 0],
          [0, 2, 0],
          [0, 2, 0],
        ]}
      />
    ),
  },
  {
    title: 'tour.gems',
    demo: (
      <BoardDemo
        level={GEMS_LEVEL}
        frames={[
          [0, 1, 0, 0, 0, 0],
          [0, 2, 0, 0, 0, 0],
          [0, 2, 0, 0, 1, 0],
          [0, 2, 0, 0, 1, 0],
        ]}
      />
    ),
  },
  { title: 'tour.stars', demo: <StarsDemo /> },
  { title: 'tour.pal', demo: <PalGrowDemo /> },
];

/**
 * How to play, in four picture slides (Next, Next, Let's play!), opened from the Me screen. No reading
 * needed: each slide is a tiny demo that plays itself.
 */
export default function WelcomeTour({ onDone }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const tourRef = useRef(null);
  const { t } = useI18n();

  // Focus the tour itself (arrow keys, Enter on the button after Tab) without a ring on the button.
  useEffect(() => {
    tourRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    sfx.tap();
  }, [index]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowRight' && !isLast) setIndex(index + 1);
      if (event.key === 'ArrowLeft' && index > 0) setIndex(index - 1);
      if (event.key === 'Escape') onDone();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [index, isLast, onDone]);

  return (
    <div className={styles.tour} role="dialog" aria-modal="true" aria-labelledby="welcome-title" tabIndex={-1} ref={tourRef}>
      <TileDefs />
      <button type="button" className={styles.skip} onClick={onDone}>
        {t('common.close')}
      </button>
      <div className={styles.slide} key={index}>
        <div className={styles.demo}>{slide.demo}</div>
        <h1 id="welcome-title" className={`game-title ${styles.title}`}>
          {t(slide.title)}
        </h1>
      </div>
      <div className={styles.footer}>
        <span className={styles.dots} aria-label={t('common.stepOf', { n: index + 1, total: SLIDES.length })}>
          {SLIDES.map((other, i) => (
            <span key={other.title} className={i === index ? styles.dotOn : styles.dot} />
          ))}
        </span>
        <Button size="lg" icon="play" onClick={isLast ? onDone : () => setIndex(index + 1)}>
          {isLast ? t('common.gotIt') : t('common.next')}
        </Button>
      </div>
    </div>
  );
}
