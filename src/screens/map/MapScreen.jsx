import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import EventButton from '../../components/game/EventButton.jsx';
import PresentButton from '../../components/gifts/PresentButton.jsx';
import PalPresent from '../../components/gifts/PalPresent.jsx';
import { presentsWaiting } from '../../game/gifts.js';
import PalHello from '../../components/pals/PalHello.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { useLevels } from '../../state/LevelsContext.jsx';
import { isChestUnlocked, starsFor, totalStars } from '../../game/progress.js';
import { chestId } from '../../game/surprises.js';
import { MAX_STARS } from '../../game/scoring.js';
import { quipLines } from '../../game/quips.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { buildWorldStops, pathThrough, ROW_HEIGHT } from './mapLayout.js';
import styles from './Map.module.css';

const GREETING_MS = 6000;

function WorldSection({ world, levelRefs, progress, currentLevelId, currentNodeRef, greeting, onOpenChest }) {
  const stops = useMemo(() => buildWorldStops(levelRefs), [levelRefs]);
  const height = stops.length * ROW_HEIGHT;
  const earned = levelRefs.reduce((sum, ref) => sum + starsFor(progress, ref.id), 0);
  const isLevelUnlocked = (position) => position === 0 || starsFor(progress, levelRefs[position - 1].id) > 0;

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
                  greeting={isCurrent ? greeting : null}
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
        <div className={styles.gate}>
          <Icon name="lock" size={40} strokeWidth={2.6} />
          <p className="game-title">{t('map.toUnlock', { count: world.starsToUnlock - stars })}</p>
        </div>
      </div>
      <WorldSign world={world} headingId={`world-${world.id}`} isLocked className={styles.worldSign} />
    </section>
  );
}

/** Levels solved before the daily puzzle, gift and other extras show up on the map. */
const EXTRAS_AFTER_LEVELS = 3;

export default function MapScreen() {
  const { progress, claimChest } = usePlayer();
  const { worlds, levelRefsInWorld } = useLevels();
  const [chestOpening, setChestOpening] = useState(null);
  const currentNodeRef = useRef(null);
  const stars = totalStars(progress);
  const solvedCount = Object.values(progress.levels).filter((entry) => entry.stars > 0).length;
  const { t, line } = useI18n();
  const [greeting, setGreeting] = useState(() => line('quips.start', quipLines('start')));
  const hushLumi = useCallback(() => setGreeting(null), []);

  const unlockedWorlds = worlds.filter((world) => stars >= world.starsToUnlock);
  const nextLockedWorld = worlds.find((world) => stars < world.starsToUnlock);
  const refsByWorld = useMemo(
    () => new Map(unlockedWorlds.map((world) => [world.id, levelRefsInWorld(world.id)])),
    [unlockedWorlds.length, levelRefsInWorld], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const currentRef = [...refsByWorld.values()].flat().find((ref) => starsFor(progress, ref.id) === 0) ?? null;
  const worldsLeft = worlds.length - unlockedWorlds.length - (nextLockedWorld ? 1 : 0);

  // The current level is always the main view: centered in the space between the HUD and the PLAY button
  // (see .currentNode scroll-margin). Lumi says hello there, then lets the player focus.
  // Runs again if the current level only becomes known after the levels load.
  useEffect(() => {
    if (!currentRef) return undefined;
    const frame = requestAnimationFrame(() => currentNodeRef.current?.scrollIntoView({ block: 'center' }));
    return () => cancelAnimationFrame(frame);
  }, [currentRef?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => setGreeting(null), GREETING_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.hud}>
        {/* Brand-new players see a calm map: the extras appear once they've solved a few levels. */}
        <div className={styles.hudStart}>
          {solvedCount >= EXTRAS_AFTER_LEVELS && (
            <>
              <DailyButton />
              <EventButton />
              <RushButton />
              <PresentButton />
              <DailyGift />
              <InstallButton />
            </>
          )}
        </div>
        <CurrencyHud />
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
            greeting={greeting}
            onOpenChest={(worldId, chestNumber) => setChestOpening(claimChest(worldId, chestNumber))}
          />
        ))}
        {nextLockedWorld && <LockedWorld world={nextLockedWorld} stars={stars} />}
        {worldsLeft > 0 && <p className={`game-title ${styles.teaser}`}>{t('map.teaser', { count: worldsLeft, levels: worldsLeft * 20 })}</p>}
        {currentRef && (
          <a href={`#/play/${currentRef.id}`} className={styles.playButton}>
            <span className="game-title on-color">{t('map.play')}</span>
            {progress.hotStreak >= 2 && (
              <span className={styles.hotStreak} role="img" aria-label={t('map.hotStreak', { count: progress.hotStreak })}>
                <Icon name="flame" size={12} />
                <span className="game-title on-color">{progress.hotStreak}</span>
              </span>
            )}
            <span className={styles.playLevel}>{t('level.title', { label: `${currentRef.world}-${currentRef.index}` })}</span>
          </a>
        )}
      </main>

      {/* The partner Pal says hello once a day (Lumi lets them talk), or holds up a waiting present. */}
      {currentRef && <PalPresent />}
      {currentRef && presentsWaiting(progress) === 0 && <PalHello onHello={hushLumi} />}
      <BottomNav active="map" />
      {chestOpening && <ChestDialog opening={chestOpening} onClose={() => setChestOpening(null)} />}
    </div>
  );
}
