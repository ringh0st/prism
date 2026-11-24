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
import LegendaryPresentButton from '../../components/gifts/LegendaryPresentButton.jsx';
import PalPresent from '../../components/gifts/PalPresent.jsx';
import { presentsWaiting } from '../../game/gifts.js';
import PalHello from '../../components/pals/PalHello.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { isFeatureOpen } from '../../game/unlocks.js';
import { FRIEND_AFTER_LEVELS } from '../../game/firstFriend.js';
import { useNewExtra } from '../../hooks/useNewExtra.js';
import { useLevels } from '../../state/LevelsContext.jsx';
import { isChestUnlocked, starsFor, totalStars } from '../../game/progress.js';
import { chestId } from '../../game/surprises.js';
import { areAllLevelsOpen } from '../../lib/openAllLevels.js';
import { MAX_STARS } from '../../game/scoring.js';
import { isNativeApp } from '../../lib/platform.js';
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
                  // The first friend turns up after this level: a wrapped surprise waits on it.
                  hasSurprise={!progress.pal?.id && world.id === 1 && position === FRIEND_AFTER_LEVELS - 1}
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

/** The picture on each feature's "New!" note. */
const NEW_ICONS = { gift: 'gift', daily: 'calendar', missions: 'check', treats: 'heart', quests: 'star', glowbugs: 'heart', stickers: 'star' };

/** The HUD's see-through lower edge, in px: the road may show under it. */
const HUD_FADE = 26;
/** From the bottom of PLAY up to the top of the Pal's bubble beside it (PalPresent, PalHello), in px. */
const PAL_ROOM = 170;
/** From the middle of the current level down to the bottom of the level before it, in px. */
const ROOM_FOR_LEVEL_BEFORE = ROW_HEIGHT + 39;

export default function MapScreen() {
  const { progress, claimChest } = usePlayer();
  const { worlds, levelRefsInWorld } = useLevels();
  const [chestOpening, setChestOpening] = useState(null);
  const currentNodeRef = useRef(null);
  const hudRef = useRef(null);
  const playRef = useRef(null);
  const [isHelloUp, setIsHelloUp] = useState(false);
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
  const hasPresent = Boolean(progress.pal.id) && presentsWaiting(progress) > 0;
  const isPalBesidePlay = hasPresent || isHelloUp;
  const worldsLeft = worlds.length - unlockedWorlds.length - (nextLockedWorld ? 1 : 0);

  // The current level is always the main view: in the middle of the clear stretch of road between the HUD
  // and PLAY (or the partner Pal's bubble above PLAY, while it's up), with the level before it clear of
  // them too, and Lumi bouncing beside it.
  // Runs again if the current level only becomes known after the levels load, and when the Pal pops up.
  useEffect(() => {
    if (!currentRef) return undefined;
    const frame = requestAnimationFrame(() => {
      const node = currentNodeRef.current?.getBoundingClientRect();
      const play = playRef.current?.getBoundingClientRect();
      if (!node || !play) return;
      const top = hudRef.current.getBoundingClientRect().bottom - HUD_FADE;
      const bottom = isPalBesidePlay ? play.bottom - PAL_ROOM : play.top;
      const center = Math.min((top + bottom) / 2, bottom - ROOM_FOR_LEVEL_BEFORE);
      window.scrollBy(0, node.top + node.height / 2 - center);
    });
    return () => cancelAnimationFrame(frame);
  }, [currentRef?.id, isPalBesidePlay]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.page}>
      <header ref={hudRef} className={styles.hud}>
        <div className={styles.hudTop}>
          {/* Back to the page with all of Rinny's games (the app has no such page to go to). */}
          {!isNativeApp && (
            <a className={styles.allGames} href="../" aria-label={t('map.allGames')} title={t('map.allGames')}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <rect x="3" y="3" width="8" height="8" rx="2.5" />
                <rect x="13" y="3" width="8" height="8" rx="2.5" />
                <rect x="3" y="13" width="8" height="8" rx="2.5" />
                <rect x="13" y="13" width="8" height="8" rx="2.5" />
              </svg>
            </a>
          )}
          <CurrencyHud />
        </div>
        {/* Things to do now, each with its name. They open one at a time as the player goes (unlocks.js). */}
        <div className={styles.hudStart}>
          {isFeatureOpen('gift', solvedCount) && <DailyGift />}
          <LegendaryPresentButton />
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
        {/* First in the page so the keyboard reaches PLAY before the road's levels; it's fixed, so it looks the same. */}
        {currentRef && (
          <a
            ref={playRef}
            href={`#/play/${currentRef.id}`}
            className={styles.playButton}
            onPointerDown={() => sfx.press()}
            aria-label={[
              t('map.play'),
              t('level.title', { label: levelNumber(currentRef.world, currentRef.index) }),
              progress.hotStreak >= 2 && t('map.hotStreak', { count: progress.hotStreak }),
            ]
              .filter(Boolean)
              .join(', ')}
          >
            {/* One slim row: the word and the level's number (owner: PLAY looked fat and unclear). */}
            <span className={styles.playRow}>
              <span className="game-title on-color">{t('map.play')}</span>
              <span className={styles.playLevel} dir="ltr" aria-hidden="true">
                {levelNumber(currentRef.world, currentRef.index)}
              </span>
            </span>
            {progress.hotStreak >= 2 && (
              <span className={styles.hotStreak} aria-hidden="true">
                <Icon name="flame" size={12} />
                <span className="game-title on-color">{progress.hotStreak}</span>
              </span>
            )}
          </a>
        )}
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
      </main>

      {/* The road fades out under PLAY and the bar, so nothing is half-covered by them. */}
      <div className={styles.groundFade} aria-hidden="true" />
      {/* The partner Pal says hello once a day, or holds up a waiting present. */}
      {currentRef && <PalPresent />}
      {currentRef && presentsWaiting(progress) === 0 && <PalHello onShow={() => setIsHelloUp(true)} />}
      <BottomNav active="map" />
      {chestOpening && <ChestDialog opening={chestOpening} onClose={() => setChestOpening(null)} />}
    </div>
  );
}
