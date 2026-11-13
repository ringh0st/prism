import { useEffect } from 'react';
import Ribbon from '../../components/game/Ribbon.jsx';
import Button from '../../components/Button.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import GemShape from '../../components/GemShape.jsx';
import { moveLimitFor } from '../../game/scoring.js';
import { TILE } from '../../game/constants.js';
import styles from './LevelIntro.module.css';

const STICKERS = {
  boss: { text: 'BOSS LEVEL!', className: 'boss' },
  disco: { text: 'DISCO LEVEL!', className: 'disco' },
  night: { text: 'NIGHT LEVEL', className: 'night' },
};

/** How long the intro stays before the level starts by itself (any tap starts it sooner). */
const INTRO_MS = 1600;

/** "Level 7 · The Sneaky Pickle · Light 2 gems in 6 moves". Tap anywhere or wait to start. */
export default function LevelIntro({ level, title, subtitle, modifier, lumiLine, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, modifier === 'normal' ? INTRO_MS : INTRO_MS * 1.6);
    return () => clearTimeout(timer);
  }, [onDone]);

  const gems = level.tiles.filter((tile) => tile.type === TILE.GEM);
  const limit = moveLimitFor(level.par, level.difficulty);
  const sticker = STICKERS[modifier];

  return (
    // Clicking anywhere also starts; the button is the keyboard and screen-reader path.
    <div className={`${styles.overlay} ${sticker ? styles[sticker.className] : ''}`} onClick={onDone} role="presentation">
      <div className={styles.card}>
        <p className={styles.subtitle}>{subtitle}</p>
        <Ribbon as="h1" size="lg" tone={modifier === 'boss' ? 'alert' : 'sage'}>
          {title}
        </Ribbon>
        {sticker && <p className={`game-title ${styles.sticker}`}>{sticker.text}</p>}
        <p className={styles.goal}>
          Light {gems.length === 1 ? 'the gem' : `all ${gems.length} gems`}
          <span className={styles.gems}>
            {gems.map((gem, i) => (
              <GemShape key={i} color={gem.color} size={22} />
            ))}
          </span>
          in <strong>{limit}</strong> moves
        </p>
        <div className={styles.lumi}>
          <Lumi mood={modifier === 'disco' ? 'dance' : modifier === 'boss' ? 'worried' : 'excited'} size={70} line={lumiLine} bubbleSide="right" />
        </div>
        <Button size="lg" icon="play" onClick={onDone} data-autofocus autoFocus>
          Let’s go!
        </Button>
      </div>
    </div>
  );
}
