import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext.jsx';
import ScreenTitle from '../../components/game/ScreenTitle.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import LumiSays from '../../components/game/LumiSays.jsx';
import { lumisOf } from '../../game/boardThemes.js';
import TargetIcon from '../../components/game/TargetIcon.jsx';
import GlowbugArt from '../../components/glowbugs/GlowbugArt.jsx';
import TapIcon from './TapIcon.jsx';
import { SmudgeArt } from '../../components/board/darkTileArt.jsx';
import BoosterPicker from './BoosterPicker.jsx';
import PalPowerChip from './PalPowerChip.jsx';
import TeamSwitcher from '../pals/TeamSwitcher.jsx';
import { glowbugById } from '../../game/glowbugs.js';
import { glowbugName } from '../../i18n/groveText.js';
import { moveLimitFor } from '../../game/scoring.js';
import { TILE } from '../../game/constants.js';
import styles from './LevelIntro.module.css';

/** A crescent moon for night levels (the icon set has none). */
const moon = (
  <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
    <path d="M19 15.5A8 8 0 0 1 8.5 5a8 8 0 1 0 10.5 10.5Z" fill="currentColor" />
  </svg>
);

/** Each special level wears its mood: a medallion with a symbol and the card's own colors (the word is for screen readers). */
const MOODS = {
  hard: { key: 'intro.sticker.hard', art: <Icon name="flame" size={30} /> },
  extra: { key: 'intro.sticker.extra', art: <Icon name="flame" size={36} /> },
  boss: { key: 'intro.sticker.boss', art: <Icon name="crown" size={32} /> },
  disco: { key: 'intro.sticker.disco', art: <Icon name="spark" size={30} /> },
  night: { key: 'intro.sticker.night', art: moon },
};

/** Smudge's face, for bosses where his shadows are on the march. */
const smudgeFace = (
  <svg viewBox="0 0 100 100" width="40" height="40" aria-hidden="true">
    <SmudgeArt />
  </svg>
);

/** How long the intro stays before the level starts by itself (any tap starts it sooner). */
const INTRO_MS = 3500;

/**
 * The level at a glance, almost no words: its name, the gems to light, ★★★ and the moves for it (a tapping
 * finger), and the mood of a special level as the card's look. Tap anywhere or wait to start.
 * `lumiLine` is only for what the picture can't say (a friend's challenge, the Rush's spare moves).
 * `flavor` ({ name, goal }, see recipes.js) is read out to screen readers; Lumi says its goal once the level starts.
 * `waitsForTap` keeps it up until the player taps (the very first levels, for new players).
 * `boosters` ({ owned, chosen, onToggle }) shows the booster picks; touching one keeps the card up until Let's go.
 * `palHelp` (from partnerPower) shows your partner Pal and the power it brings to this level; with `canSwitchPal`
 * a tap on it lists your other Pals to switch to (`onPalSwitched`), which keeps the card up like a booster.
 */
export default function LevelIntro({
  level,
  title,
  subtitle,
  modifier,
  lumiLine = '',
  moveLimit,
  showsStarTarget = true,
  flavor = null,
  waitsForTap = false,
  glowbugId = null,
  boosters = null,
  palHelp = null,
  palWearing = [],
  canSwitchPal = false,
  onPalSwitched,
  onDone,
}) {
  // A Hard or Extra Hard level always says so, even when it's also a night or disco level (difficulty first).
  const moods = [level.difficulty, modifier].filter((id) => MOODS[id]);
  const mood = MOODS[modifier] ? modifier : (moods[0] ?? null);
  // Picking boosters takes a moment: once one is touched, the card waits for Let's go.
  const [isPicking, setIsPicking] = useState(false);
  const [isSwitchingPal, setIsSwitchingPal] = useState(false);
  useEffect(() => {
    // With boosters to pick, the card waits for Let's go (no rush to choose).
    if (waitsForTap || isPicking || boosters) return undefined;
    const timer = setTimeout(onDone, mood ? INTRO_MS * 1.3 : INTRO_MS);
    return () => clearTimeout(timer);
  }, [onDone, isPicking]); // eslint-disable-line react-hooks/exhaustive-deps

  const { t, lang } = useI18n();
  const gems = lumisOf(level).map(({ tile, coat }) => ({ ...tile, coat }));
  const limit = moveLimit ?? moveLimitFor(level.par, level.difficulty);
  const moves = showsStarTarget ? level.par : limit;
  const goalLabel = [
    flavor?.name,
    t('intro.lightGems', { count: gems.length }),
    showsStarTarget ? t('intro.starTarget', { count: level.par }) : t('intro.inMoves', { count: limit }),
  ]
    .filter(Boolean)
    .join('. ');

  return (
    // Clicking anywhere also starts; the button is the keyboard and screen-reader path.
    <div className={styles.overlay} onClick={onDone} role="presentation">
      <div className={`${styles.card} ${mood ? styles[mood] : ''}`} onClick={(event) => event.stopPropagation()} role="presentation">
        {moods.length > 0 && (
          <span className={styles.medallions} aria-hidden="true">
            {moods.map((id) => (
              <span key={id} className={`${styles.medallion} ${styles[`medal-${id}`]}`}>
                {/* A boss with Smudge's shadows shows Smudge himself. */}
                {id === 'boss' && level.glooms?.length ? smudgeFace : MOODS[id].art}
              </span>
            ))}
          </span>
        )}
        {moods.length > 0 && <p className={`game-title ${styles.moodWords}`}>{moods.map((id) => t(MOODS[id].key)).join(' · ')}</p>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <ScreenTitle as="h1" size="lg" tone={modifier === 'boss' ? 'boss' : 'calm'}>
          {title}
        </ScreenTitle>
        {/* The goal as pictures: the gems to light, then ★★★ and the moves (words only for screen readers). */}
        <div className={styles.goal} role="img" aria-label={goalLabel}>
          <span className={styles.gems}>
            {gems.map((gem, i) => (
              <span key={i} className={styles.gem} style={{ '--i': i }}>
                <TargetIcon color={gem.color} coat={gem.coat} size={40} />
              </span>
            ))}
          </span>
          <span className={`game-title ${styles.target}`}>
            {showsStarTarget && <span className={styles.stars}>★★★</span>}
            <span className={styles.moves}>
              <span dir="ltr">{moves}</span>
              <TapIcon size={26} />
            </span>
          </span>
        </div>
        {glowbugId && (
          <p className={styles.glowbug} role="img" aria-label={t('intro.rescue', { name: glowbugName(lang, glowbugById(glowbugId)) })}>
            <GlowbugArt id={glowbugId} size={44} isAwake={false} />
            <span className="game-title">★★★</span>
          </p>
        )}
        {lumiLine ? (
          <div className={styles.lumiSays}>
            <LumiSays mood="excited" size={72} line={lumiLine} />
          </div>
        ) : null}
        {palHelp && (
          <PalPowerChip
            help={palHelp}
            wearing={palWearing}
            isSwitching={isSwitchingPal}
            onSwitch={
              canSwitchPal
                ? () => {
                    setIsPicking(true);
                    setIsSwitchingPal(!isSwitchingPal);
                  }
                : null
            }
          />
        )}
        {isSwitchingPal && (
          <TeamSwitcher
            compact
            onSwitched={(palId) => {
              onPalSwitched(palId);
              setIsSwitchingPal(false);
            }}
          />
        )}
        {boosters && (
          <BoosterPicker
            owned={boosters.owned}
            chosen={boosters.chosen}
            free={boosters.free}
            streak={boosters.streak}
            onToggle={(id) => {
              setIsPicking(true);
              boosters.onToggle(id);
            }}
          />
        )}
        <div className={styles.footer}>
          {!lumiLine && (
            <span className={styles.lumi} aria-hidden="true">
              <Lumi mood={modifier === 'disco' ? 'dance' : modifier === 'boss' ? 'worried' : 'excited'} size={64} />
            </span>
          )}
          <Button size="lg" icon="play" onClick={onDone} data-autofocus autoFocus>
            {t('intro.go')}
          </Button>
        </div>
      </div>
    </div>
  );
}
