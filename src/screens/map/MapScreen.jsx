import { useEffect, useMemo, useRef, useState } from 'react';
import CurrencyHud from '../../components/game/CurrencyHud.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import Ribbon from '../../components/game/Ribbon.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import Icon from '../../components/Icon.jsx';
import LevelNode from './LevelNode.jsx';
import ChestNode from './ChestNode.jsx';
import ChestDialog from './ChestDialog.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { useLevels } from '../../state/LevelsContext.jsx';
import { isChestUnlocked, starsFor, totalStars } from '../../game/progress.js';
import { chestId } from '../../game/surprises.js';
import { MAX_STARS } from '../../game/scoring.js';
import { quipFor } from '../../game/quips.js';
import { buildWorldStops, pathThrough, ROW_HEIGHT } from './mapLayout.js';
import logoUrl from '../../assets/logo.png';
import styles from './Map.module.css';

const RIBBON_TONE = { sunshine: 'gold', tangerine: 'tangerine', coral: 'coral', mint: 'mint', ember: 'coral', lime: 'mint', peach: 'tangerine', gold: 'gold' };

function WorldSection({ world, levelRefs, progress, currentLevelId, currentNodeRef, onOpenChest }) {
  const stops = useMemo(() => buildWorldStops(levelRefs), [levelRefs]);
  const height = stops.length * ROW_HEIGHT;
  const earned = levelRefs.reduce((sum, ref) => sum + starsFor(progress, ref.id), 0);
  const isLevelUnlocked = (position) => position === 0 || starsFor(progress, levelRefs[position - 1].id) > 0;

  return (
    <section className={`${styles.world} ${styles[world.theme]}`} aria-labelledby={`world-${world.id}`}>
      <header className={styles.worldHeader}>
        <p className={styles.worldNumber}>World {world.id}</p>
        <Ribbon as="h2" id={`world-${world.id}`} tone={RIBBON_TONE[world.theme] ?? 'tangerine'}>
          {world.name}
        </Ribbon>
        <p className={styles.worldTagline}>
          {world.tagline} ·{' '}
          <span className={styles.worldStars}>
            <Icon name="star" size={14} /> {earned}/{levelRefs.length * MAX_STARS}
          </span>
        </p>
      </header>
      <div className={styles.trail} style={{ height }}>
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

function LockedWorld({ world, stars }) {
  return (
    <section className={`${styles.world} ${styles.lockedWorld} ${styles[world.theme]}`} aria-label={`World ${world.id}, locked`}>
      <p className={styles.worldNumber}>World {world.id}</p>
      <Ribbon as="h2" tone="tangerine">
        {world.name}
      </Ribbon>
      <div className={styles.gate}>
        <Icon name="lock" size={40} strokeWidth={2.6} />
        <p className="game-title">{world.starsToUnlock - stars} more ★ to unlock</p>
      </div>
    </section>
  );
}

export default function MapScreen() {
  const { progress, claimChest } = usePlayer();
  const { worlds, levelRefsInWorld } = useLevels();
  const [chestOpening, setChestOpening] = useState(null);
  const currentNodeRef = useRef(null);
  const stars = totalStars(progress);
  const [greeting] = useState(() => quipFor('start'));

  const unlockedWorlds = worlds.filter((world) => stars >= world.starsToUnlock);
  const nextLockedWorld = worlds.find((world) => stars < world.starsToUnlock);
  const refsByWorld = useMemo(
    () => new Map(unlockedWorlds.map((world) => [world.id, levelRefsInWorld(world.id)])),
    [unlockedWorlds.length, levelRefsInWorld], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const currentRef = [...refsByWorld.values()].flat().find((ref) => starsFor(progress, ref.id) === 0) ?? null;
  const worldsLeft = worlds.length - unlockedWorlds.length - (nextLockedWorld ? 1 : 0);

  // Scroll just enough to show the current level above the PLAY button (see .currentNode scroll-margin).
  useEffect(() => {
    currentNodeRef.current?.scrollIntoView({ block: 'nearest' });
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.hud}>
        <a href="#/" className={styles.logo} aria-label="Prism">
          <img src={logoUrl} alt="" width="44" height="44" />
        </a>
        {progress.hotStreak >= 2 && (
          <span className={styles.hotStreak} aria-label={`Hot streak: ${progress.hotStreak} perfect levels in a row`}>
            <Icon name="flame" size={18} />
            <span className="game-title on-color">{progress.hotStreak}</span>
          </span>
        )}
        <CurrencyHud />
      </header>

      <main className={styles.map}>
        <div className={styles.welcome}>
          <Lumi mood="happy" size={64} line={greeting} />
        </div>
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
          <p className={`game-title ${styles.teaser}`}>
            + {worldsLeft} more worlds and {worldsLeft * 20} levels waiting…
          </p>
        )}
      </main>

      {currentRef && (
        <a href={`#/play/${currentRef.id}`} className={styles.playButton}>
          <span className="game-title on-color">PLAY</span>
          <span className={styles.playLevel}>
            Level {currentRef.world}-{currentRef.index}
          </span>
        </a>
      )}
      <BottomNav active="map" />
      {chestOpening && <ChestDialog opening={chestOpening} onClose={() => setChestOpening(null)} />}
    </div>
  );
}
