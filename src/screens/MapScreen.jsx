import TopBar from '../components/TopBar.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import Stars from '../components/Stars.jsx';
import DifficultyBadge from '../components/DifficultyBadge.jsx';
import { usePlayer } from '../state/PlayerContext.jsx';
import { useLevels } from '../state/LevelsContext.jsx';
import { BEAM_THEMES, currentStreak, starsFor, totalStars } from '../game/progress.js';
import { todayKey } from '../game/daily.js';
import { MAX_STARS } from '../game/scoring.js';
import styles from './MapScreen.module.css';

export function isLevelUnlocked(progress, worldLevels, position) {
  return position === 0 || starsFor(progress, worldLevels[position - 1].id) > 0;
}

function DailyCard({ progress }) {
  const today = todayKey();
  const streak = currentStreak(progress, today);
  const isDoneToday = progress.daily.lastDate === today;
  return (
    <section className={styles.daily} aria-labelledby="daily-title">
      <div className={styles.dailyIcon} aria-hidden="true">
        <Icon name="calendar" size={28} />
      </div>
      <div className={styles.dailyText}>
        <h2 id="daily-title">Daily puzzle</h2>
        <p>
          {isDoneToday ? 'Done for today. Come back tomorrow!' : 'A fresh puzzle every day.'}
          {streak > 0 && (
            <span className={styles.streak}>
              <Icon name="flame" size={16} /> {streak}-day streak
            </span>
          )}
        </p>
      </div>
      <Button as="a" href="#/daily" variant={isDoneToday ? 'secondary' : 'primary'} icon={isDoneToday ? 'check' : 'play'}>
        {isDoneToday ? 'Replay' : 'Play'}
      </Button>
    </section>
  );
}

function NextReward({ stars }) {
  const next = BEAM_THEMES.find((theme) => theme.starsToUnlock > stars);
  if (!next) return null;
  const previous = [...BEAM_THEMES].reverse().find((theme) => theme.starsToUnlock <= stars);
  const span = next.starsToUnlock - previous.starsToUnlock;
  const percent = Math.round(((stars - previous.starsToUnlock) / span) * 100);
  return (
    <a href="#/settings" className={styles.reward}>
      <span className={styles.rewardSwatch} style={{ background: next.color }} aria-hidden="true" />
      <span className={styles.rewardText}>
        <strong>{next.name} beam</strong> unlocks at {next.starsToUnlock} ★
      </span>
      <span className={styles.meter} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Progress to next reward">
        <span style={{ width: `${percent}%` }} />
      </span>
    </a>
  );
}

function LevelTile({ level, number, stars, isUnlocked, isCurrent }) {
  const label = `Level ${number}${level.difficulty !== 'normal' ? `, ${level.difficulty === 'hard' ? 'hard' : 'extra hard'}` : ''}, ${
    isUnlocked ? `${stars} of ${MAX_STARS} stars` : 'locked'
  }`;
  if (!isUnlocked) {
    return (
      <li>
        <span className={`${styles.level} ${styles.locked} ${styles[level.difficulty]}`} aria-label={label} role="img">
          <Icon name="lock" size={18} />
        </span>
      </li>
    );
  }
  return (
    <li>
      <a
        href={`#/play/${level.id}`}
        className={`${styles.level} ${styles[level.difficulty]} ${isCurrent ? styles.current : ''} ${stars === 3 ? styles.perfect : ''}`}
        aria-label={label}
      >
        <span className={styles.levelNumber}>{number}</span>
        <Stars count={stars} size={11} />
        {level.difficulty !== 'normal' && (
          <span className={styles.levelBadge}>
            <DifficultyBadge difficulty={level.difficulty} compact />
          </span>
        )}
      </a>
    </li>
  );
}

function WorldSection({ world, worldLevels, progress, stars, currentLevelId }) {
  const isUnlocked = stars >= world.starsToUnlock;
  const earned = worldLevels.reduce((sum, level) => sum + starsFor(progress, level.id), 0);
  const possible = worldLevels.length * MAX_STARS;
  return (
    <section className={`${styles.world} ${styles[world.theme]}`} aria-labelledby={`world-${world.id}`}>
      <header className={styles.worldHeader}>
        <div>
          <p className={styles.worldNumber}>World {world.id}</p>
          <h2 id={`world-${world.id}`}>{world.name}</h2>
          <p className={styles.tagline}>{world.tagline}</p>
        </div>
        <span className={styles.worldStars} aria-label={`${earned} of ${possible} stars`}>
          <Icon name="star" size={16} /> {earned}/{possible}
        </span>
      </header>
      {isUnlocked ? (
        <ol className={styles.levels}>
          {worldLevels.map((level, position) => (
            <LevelTile
              key={level.id}
              level={level}
              number={position + 1}
              stars={starsFor(progress, level.id)}
              isUnlocked={isLevelUnlocked(progress, worldLevels, position)}
              isCurrent={level.id === currentLevelId}
            />
          ))}
        </ol>
      ) : (
        <div className={styles.worldLocked}>
          <Icon name="lock" size={26} />
          <p>
            Collect <strong>{world.starsToUnlock - stars} more ★</strong> to unlock
          </p>
        </div>
      )}
    </section>
  );
}

export default function MapScreen() {
  const { progress } = usePlayer();
  const { worlds, levelsInWorld } = useLevels();
  const stars = totalStars(progress);

  const playable = worlds
    .filter((world) => stars >= world.starsToUnlock)
    .flatMap((world) => levelsInWorld(world.id));
  const continueLevel = playable.find((level) => starsFor(progress, level.id) === 0) ?? null;

  return (
    <div className={styles.page}>
      <TopBar />
      <main className={styles.main}>
        {continueLevel && (
          <a href={`#/play/${continueLevel.id}`} className={styles.continue}>
            <span>
              <span className={styles.continueLabel}>{stars === 0 ? 'Start playing' : 'Continue'}</span>
              <span className={styles.continueLevel}>
                World {continueLevel.world} · Level {continueLevel.index}
              </span>
            </span>
            <span className={styles.continueButton} aria-hidden="true">
              <Icon name="play" size={26} />
            </span>
          </a>
        )}
        <DailyCard progress={progress} />
        <NextReward stars={stars} />
        {worlds.map((world) => (
          <WorldSection
            key={world.id}
            world={world}
            worldLevels={levelsInWorld(world.id)}
            progress={progress}
            stars={stars}
            currentLevelId={continueLevel?.id}
          />
        ))}
      </main>
    </div>
  );
}
