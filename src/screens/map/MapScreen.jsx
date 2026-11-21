import { levelNumber } from '../../game/worlds.js';
import { sfx } from '../../audio/sfx.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import CurrencyHud from '../../components/game/CurrencyHud.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import Icon from '../../components/Icon.jsx';
import LevelNode from './LevelNode.jsx';
import ChestNode from './ChestNode.jsx';
import ChestDialog from './ChestDialog.jsx';
import WorldScenery from './scenery/WorldScenery.jsx';
import WorldSign from './scenery/WorldSign.jsx';
import DailyGift from '../../components/game/DailyGift.jsx';
import DailyButton from '../../components/game/DailyButton.jsx';
import InstallButton from '../../components/install/InstallButton.jsx';
import RushButton from '../../components/game/RushButton.jsx';
import MissionsButton from '../../components/game/MissionsButton.jsx';
import EventButton from '../../components/game/EventButton.jsx';
import PresentButton from '../../components/gifts/PresentButton.jsx';
import PalPresent from '../../components/gifts/PalPresent.jsx';
import { presentsWaiting } from '../../game/gifts.js';
import PalHello from '../../components/pals/PalHello.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { isFeatureOpen } from '../../game/unlocks.js';
import { nextGoalFor } from '../../game/nextGoal.js';
import { useNewExtra } from '../../hooks/useNewExtra.js';
import { useLevels } from '../../state/LevelsContext.jsx';
import { isChestUnlocked, starsFor, totalStars } from '../../game/progress.js';
import { chestId } from '../../game/surprises.js';
import { areAllLevelsOpen } from '../../lib/openAllLevels.js';
import { MAX_STARS } from '../../game/scoring.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { buildWorldStops, pathThrough, ROW_HEIGHT } from './mapLayout.js';
import styles from './Map.module.css';

function WorldSection({ world, levelRefs, progress, currentLevelId, currentNodeRef, onOpenChest }) {
  const stops = useMemo(() => buildWorldStops(levelRefs), [levelRefs]);
  const height = stops.length * ROW_HEIGHT;
  const earned = levelRefs.reduce((sum, ref) => sum + starsFor(progress, ref.id), 0);
  const isLevelUnlocked = (position) => position === 0 || areAllLevelsOpen() || starsFor(progress, levelRefs[position - 1].id) > 0;

  return (
    <section className={`${styles.world} ${styles[world.theme]}`} aria-labelledby={`world-${world.id}`}>
      <WorldSign world={world} headingId={`world-${world.id}`} earned={earned} total={levelRefs.length * MAX_STARS} className={styles.worldSign} />
      <div className={styles.trail} style={{ height }}>
        <WorldScenery stops={stops} worldId={world.id} theme={world.theme} />
        <svg className={styles.path} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={pathThrough(stops, 100)} className={styles.pathShadow} vectorEffect="non-scaling-stroke" />
          <path d={pathThrough(stops, 100)} className={styles.pathLine} vectorEffect="non-scaling-stroke" />
        </svg>
        <ol className={styles.stops}>
          {stops.map((stop) => {
            if (stop.kind === 'chest') {
              const key = chestId(world.id, stop.chestNumber);
              const state = progress.claimedChests.includes(key)
                ? 'opened'
                : isChestUnlocked(progress, levelRefs, stop.levelsNeeded)
                  ? 'ready'
                  : 'locked';
              return (
                <li key={key}>
                  <ChestNode stop={stop} state={state} onOpen={() => onOpenChest(world.id, stop.chestNumber)} />
                </li>
              );
            }
            const position = levelRefs.indexOf(stop.ref);
            const isCurrent = stop.ref.id === currentLevelId;
            return (
              <li key={stop.ref.id}>
                <LevelNode
                  stop={stop}
                  stars={starsFor(progress, stop.ref.id)}
                  isUnlocked={isLevelUnlocked(position)}
                  isCurrent={isCurrent}
                  nodeRef={isCurrent ? currentNodeRef : undefined}
                />
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// A short, foggy stretch of the next world's landscape, so players can see what's coming.
const LOCKED_PREVIEW_STOPS = buildWorldStops(Array.from({ length: 4 }, (_, i) => ({ id: `preview-${i}` })));

function LockedWorld({ world, stars }) {
  const { t } = useI18n();
  return (
    <section className={`${styles.world} ${styles.lockedWorld} ${styles[world.theme]}`} aria-labelledby={`world-${world.id}`}>
      <div className={styles.lockedView} style={{ height: LOCKED_PREVIEW_STOPS.length * ROW_HEIGHT }}>
        <WorldScenery stops={LOCKED_PREVIEW_STOPS} worldId={world.id} theme={world.theme} />
        {/* Locked: the stars still needed, as a number (the sentence is for screen readers). */}
        <div className={styles.gate} role="img" aria-label={t('map.toUnlock', { count: world.starsToUnlock - stars })}>
          <Icon name="lock" size={40} strokeWidth={2.6} />
          <p className={`game-title ${styles.gateStars}`}>
            <Icon name="star" size={26} />
            <span dir="ltr">{world.starsToUnlock - stars}</span>
          </p>
        </div>
      </div>
      <WorldSign world={world} headingId={`world-${world.id}`} isLocked className={styles.worldSign} />
    </section>
  );
}

/** The picture for each kind of next goal on the PLAY button. */
const GOAL_ICONS = { friend: 'heart', present: 'gift', world: 'map' };
/** The picture on each feature's "New!" note. */
const NEW_ICONS = { gift: 'gift', daily: 'calendar', missions: 'check', treats: 'heart', quests: 'star', glowbugs: 'heart', stickers: 'star' };

export default function MapScreen() {
  const { progress, claimChest } = usePlayer();
  const { worlds, levelRefsInWorld } = useLevels();
  const [chestOpening, setChestOpening] = useState(null);
  const currentNodeRef = useRef(null);
  const stars = totalStars(progress);
  const solvedCount = Object.values(progress.levels).filter((entry) => entry.stars > 0).length;
  const { t } = useI18n();
  const { newExtra, markSeen } = useNewExtra(solvedCount);

  const unlockedWorlds = worlds.filter((world) => stars >= world.starsToUnlock);
  const nextLockedWorld = worlds.find((world) => stars < world.starsToUnlock);
  const refsByWorld = useMemo(
    () => new Map(unlockedWorlds.map((world) => [world.id, levelRefsInWorld(world.id)])),
    [unlockedWorlds.length, levelRefsInWorld], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const currentRef = [...refsByWorld.values()].flat().find((ref) => starsFor(progress, ref.id) === 0) ?? null;
  // The closest prize to play for, shown on the PLAY button.
  const levelsLeftInWorld = currentRef ? (refsByWorld.get(currentRef.world) ?? []).filter((ref) => starsFor(progress, ref.id) === 0).length : 0;
  const goal = currentRef ? nextGoalFor(progress, levelsLeftInWorld) : null;
  const worldsLeft = worlds.length - unlockedWorlds.length - (nextLockedWorld ? 1 : 0);

  // The current level is always the main view: centered in the space between the HUD and the PLAY button
  // (see .currentNode scroll-margin), with Lumi bouncing beside it.
  // Runs again if the current level only becomes known after the levels load.
  useEffect(() => {
    if (!currentRef) return undefined;
    const frame = requestAnimationFrame(() => currentNodeRef.current?.scrollIntoView({ block: 'center' }));
    return () => cancelAnimationFrame(frame);
  }, [currentRef?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.page}>
      <header className={styles.hud}>
        <CurrencyHud />
        {/* Things to do now, each with its name. They open one at a time as the player goes (unlocks.js). */}
        <div className={styles.hudStart}>
          {isFeatureOpen('gift', solvedCount) && <DailyGift />}
          <PresentButton />
          {isFeatureOpen('daily', solvedCount) && <DailyButton />}
          {isFeatureOpen('missions', solvedCount) && <MissionsButton />}
          <EventButton />
          <RushButton />
          {isFeatureOpen('install', solvedCount) && <InstallButton />}
        </div>
        {newExtra && (
          <button type="button" className={styles.newNote} onClick={() => markSeen(newExtra)}>
            <span className={styles.newIcon} aria-hidden="true">
              <Icon name={NEW_ICONS[newExtra] ?? 'star'} size={18} />
            </span>
            <span>{t(`map.new.${newExtra}`)}</span>
            <span className={styles.newOk}>{t('map.new.ok')}</span>
          </button>
        )}
      </header>

      <main className={styles.map}>
        {unlockedWorlds.map((world) => (
          <WorldSection
            key={world.id}
            world={world}
            levelRefs={refsByWorld.get(world.id) ?? []}
            progress={progress}
            currentLevelId={currentRef?.id}
            currentNodeRef={currentNodeRef}
            onOpenChest={(worldId, chestNumber) => setChestOpening(claimChest(worldId, chestNumber))}
          />
        ))}
        {nextLockedWorld && <LockedWorld world={nextLockedWorld} stars={stars} />}
        {worldsLeft > 0 && (
          <p className={`game-title ${styles.teaser}`} role="img" aria-label={t('map.teaser', { count: worldsLeft, levels: worldsLeft * 20 })}>
            <Icon name="map" size={22} />
            <span dir="ltr">+{worldsLeft}</span>
          </p>
        )}
        {currentRef && (
          <a
            href={`#/play/${currentRef.id}`}
            className={styles.playButton}
            onPointerDown={() => sfx.press()}
            aria-label={[
              t('map.play'),
              t('level.title', { label: levelNumber(currentRef.world, currentRef.index) }),
              progress.hotStreak >= 2 && t('map.hotStreak', { count: progress.hotStreak }),
              goal && t(`map.goal.${goal.kind}`, { count: goal.left }),
            ]
              .filter(Boolean)
              .join(', ')}
          >
            <span className="game-title on-color">{t('map.play')}</span>
            {progress.hotStreak >= 2 && (
              <span className={styles.hotStreak} aria-hidden="true">
                <Icon name="flame" size={12} />
                <span className="game-title on-color">{progress.hotStreak}</span>
              </span>
            )}
            <span className={styles.playLevel} dir="ltr" aria-hidden="true">
              {levelNumber(currentRef.world, currentRef.index)}
            </span>
            {/* The closest prize, as a picture: "3 ★ → present", "2 levels → new world" (nextGoal.js). */}
            {goal && (
              <span className={styles.nextGoal} dir="ltr" aria-hidden="true">
                <Icon name={goal.unit === 'stars' ? 'star' : 'play'} size={12} />
                <span className="game-title on-color">{goal.left}</span>
                <span className={styles.goalArrow}>→</span>
                <Icon name={GOAL_ICONS[goal.kind]} size={15} />
              </span>
            )}
          </a>
        )}
      </main>

      {/* The road fades out under PLAY and the bar, so nothing is half-covered by them. */}
      <div className={styles.groundFade} aria-hidden="true" />
      {/* The partner Pal says hello once a day, or holds up a waiting present. */}
      {currentRef && <PalPresent />}
      {currentRef && presentsWaiting(progress) === 0 && <PalHello />}
      <BottomNav active="map" />
      {chestOpening && <ChestDialog opening={chestOpening} onClose={() => setChestOpening(null)} />}
    </div>
  );
}
