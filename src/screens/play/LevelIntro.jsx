import { useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext.jsx';
import ScreenTitle from '../../components/game/ScreenTitle.jsx';
import Button from '../../components/Button.jsx';
import LumiSays from '../../components/game/LumiSays.jsx';
import GemShape from '../../components/GemShape.jsx';
import GlowbugArt from '../../components/glowbugs/GlowbugArt.jsx';
import { glowbugById } from '../../game/glowbugs.js';
import { glowbugName } from '../../i18n/groveText.js';
import { moveLimitFor } from '../../game/scoring.js';
import { TILE } from '../../game/constants.js';
import styles from './LevelIntro.module.css';

const DIFFICULTY_STICKERS = {
  hard: { key: 'intro.sticker.hard', className: 'hard' },
};

const STICKERS = {
  boss: { key: 'intro.sticker.boss', className: 'boss' },
  disco: { key: 'intro.sticker.disco', className: 'disco' },
  night: { key: 'intro.sticker.night', className: 'night' },
};

/** How long the intro stays before the level starts by itself (any tap starts it sooner). */
const INTRO_MS = 3500;
/** Levels with a flavor stay up longer, so there's time to read what's different. */
const FLAVOR_INTRO_MS = 4500;

/**
 * "Level 7 · The Sneaky Pickle · Light 2 gems in 6 moves". Tap anywhere or wait to start.
 * `flavor` ({ name, goal }, see recipes.js) says what's different about this level.
 * `waitsForTap` keeps it up until the player taps (the very first levels, for new players).
 */
export default function LevelIntro({
  level,
  title,
  subtitle,
  modifier,
  lumiLine,
  moveLimit,
  showsStarTarget = true,
  flavor = null,
  waitsForTap = false,
  glowbugId = null,
  onDone,
}) {
  useEffect(() => {
    if (waitsForTap) return undefined;
    const timer = setTimeout(onDone, flavor ? FLAVOR_INTRO_MS : modifier === 'normal' ? INTRO_MS : INTRO_MS * 1.6);
    return () => clearTimeout(timer);
  }, [onDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const { t, lang } = useI18n();
  const gems = level.tiles.filter((tile) => tile.type === TILE.GEM);
  const limit = moveLimit ?? moveLimitFor(level.par, level.difficulty);
  // Hard and Extra Hard levels get their own stamp, so a tougher level is never a surprise.
  const sticker = STICKERS[modifier] ?? DIFFICULTY_STICKERS[level.difficulty];

  return (
    // Clicking anywhere also starts; the button is the keyboard and screen-reader path.
    <div className={`${styles.overlay} ${sticker ? styles[sticker.className] : ''}`} onClick={onDone} role="presentation">
      <div className={styles.card} onClick={(event) => event.stopPropagation()} role="presentation">
        <p className={styles.subtitle}>{subtitle}</p>
        <ScreenTitle as="h1" size="lg" tone={modifier === 'boss' ? 'boss' : 'calm'}>
          {title}
        </ScreenTitle>
        {sticker && <p className={`game-title ${styles.sticker}`}>{t(sticker.key)}</p>}
        {flavor && <p className={`game-title ${styles.flavor}`}>✨ {flavor.name}</p>}
        <p className={styles.goal}>
          {t('intro.lightGems', { count: gems.length })}
          <span className={styles.gems}>
            {gems.map((gem, i) => (
              <GemShape key={i} color={gem.color} size={22} />
            ))}
          </span>
          <span className={styles.together}>
            {showsStarTarget ? <>{t('intro.starTarget', { count: level.par })}</> : <>{t('intro.inMoves', { count: limit })}</>}
          </span>
        </p>
        {glowbugId && (
          <p className={styles.glowbug}>
            <GlowbugArt id={glowbugId} size={40} isAwake={false} />
            <span>{t('intro.rescue', { name: glowbugName(lang, glowbugById(glowbugId)) })}</span>
          </p>
        )}
        <div className={styles.lumi}>
          <LumiSays mood={modifier === 'disco' ? 'dance' : modifier === 'boss' ? 'worried' : 'excited'} size={84} line={flavor?.goal ?? lumiLine} />
        </div>
        <Button size="lg" icon="play" onClick={onDone} data-autofocus autoFocus>
          {t('intro.go')}
        </Button>
      </div>
    </div>
  );
}
