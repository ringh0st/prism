import { useEffect, useRef, useState } from 'react';
import Button from '../../components/Button.jsx';
import { TileDefs } from '../../components/board/TileArt.jsx';
import BoardDemo from './BoardDemo.jsx';
import StarsDemo from './StarsDemo.jsx';
import PalGrowDemo from './PalGrowDemo.jsx';
import { sfx } from '../../audio/sfx.js';
import styles from './WelcomeTour.module.css';

const TAP_LEVEL = {
  width: 3,
  height: 3,
  tiles: [
    { x: 0, y: 1, type: 'emitter', dir: 'right', color: 'sun' },
    { x: 1, y: 1, type: 'mirror', orient: 1 },
    { x: 1, y: 0, type: 'gem', color: 'sun' },
  ],
};

const GEMS_LEVEL = {
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
    title: 'Tap a mirror to turn it',
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
    title: 'Light up every gem',
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
  { title: 'Fewer taps, more stars', demo: <StarsDemo /> },
  { title: 'Your Pal grows as you play', demo: <PalGrowDemo /> },
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
        Close
      </button>
      <div className={styles.slide} key={index}>
        <div className={styles.demo}>{slide.demo}</div>
        <h1 id="welcome-title" className={`game-title ${styles.title}`}>
          {slide.title}
        </h1>
      </div>
      <div className={styles.footer}>
        <span className={styles.dots} aria-label={`Step ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((other, i) => (
            <span key={other.title} className={i === index ? styles.dotOn : styles.dot} />
          ))}
        </span>
        <Button size="lg" icon="play" onClick={isLast ? onDone : () => setIndex(index + 1)}>
          {isLast ? 'Got it!' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
