import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Board from '../../components/board/Board.jsx';
import Button from '../../components/Button.jsx';
import Dialog from '../../components/Dialog.jsx';
import ScreenTitle from '../../components/game/ScreenTitle.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import SpeechBox from '../../components/game/SpeechBox.jsx';
import { celebrate } from '../../lib/effects.js';
import GemShape from '../../components/GemShape.jsx';
import HelperBar from '../../components/HelperBar.jsx';
import QuickBuyDialog from '../../components/QuickBuyDialog.jsx';
import StarMeter from './StarMeter.jsx';
import LevelIntro from './LevelIntro.jsx';
import ChallengeResultDialog from './ChallengeResultDialog.jsx';
import RushClearedDialog from '../rush/RushClearedDialog.jsx';
import RushOverDialog from '../rush/RushOverDialog.jsx';
import { RUSH_LENGTH, rushMoveLimit } from '../../game/rush.js';
import Spotlight from '../../components/tour/Spotlight.jsx';
import TileArt from '../../components/board/TileArt.jsx';
import { unseenTips } from '../../game/levelTips.js';
import WorldBackdrop from './WorldBackdrop.jsx';
import { WORLDS } from '../../game/worlds.js';
import OutOfMovesDialog from './OutOfMovesDialog.jsx';
import WinDialog from './WinDialog.jsx';
import { usePuzzle } from '../../hooks/usePuzzle.js';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { useLevels } from '../../state/LevelsContext.jsx';
import { navigate } from '../../hooks/useHashRoute.js';
import { music } from '../../audio/music.js';
import { sfx } from '../../audio/sfx.js';
import { moveLimitFor, starsForMoves } from '../../game/scoring.js';
import { HELPER_IDS, HELPERS, LENS_DURATION_MS, helpersAllowedFor } from '../../game/catalog.js';
import { isWorldComplete } from '../../game/progress.js';
import { dailyShareText } from '../../game/share.js';
import { PUBLIC_GAME_URL } from '../../lib/config.js';
import { levelNameFor } from '../../game/levelNames.js';
import { levelModifierFor } from '../../game/surprises.js';
import { quipFor } from '../../game/quips.js';
import { DIFFICULTY, TILE } from '../../game/constants.js';
import { firstTileOf, newPiecesIn, piecesMetIn } from '../../game/pieces.js';
import { findHint } from '../../game/solver.js';
import { recipeOf } from '../../game/recipes.js';
import { readJson, writeJson } from '../../lib/storage.js';
import { EVENT_LEVELS, parseEventLevelId } from '../../game/events.js';
import ComboBurst from './ComboBurst.jsx';
import { treatFoundBy } from '../../game/treats.js';
import { newStickersFor } from '../../game/stickers.js';
import { climbFor } from '../../game/titles.js';
import { usePlayStats } from '../../hooks/usePlayStats.js';
import { glowbugCellOf, glowbugForLevel, rescuedGlowbugs } from '../../game/glowbugs.js';
import { cellsOnBeams } from '../../game/beam.js';
import PalBuddy from './PalBuddy.jsx';
import { comboFor } from '../../game/combos.js';
import styles from './PlayScreen.module.css';

const WIN_DIALOG_DELAY_MS = 900;
const IDLE_AFTER_MS = 15000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SEEN_PIECES_KEY = 'prism.seenPieces.v1';
const SEEN_TIPS_KEY = 'prism.seenTips.v1';

/** Pieces already introduced on this device, or (first time) the ones met in levels already solved. */
function seenPieces(progress) {
  return readJson(SEEN_PIECES_KEY, null) ?? piecesMetIn(progress.levels);
}

/** The first three levels teach on the board itself (a pointing hand, Lamp/Gem tags) and hide the extras. */
const isFirstStepsLevel = (level, mode) => mode === 'level' && level.world === 1 && level.index <= 3;

/** New-piece cards to show; the basics are taught on the board in the first levels instead. */
function piecesToIntroduce(level, mode, progress) {
  if (mode === 'playtest') return [];
  return newPiecesIn(level, seenPieces(progress)).filter((piece) => !(piece.id === 'basics' && isFirstStepsLevel(level, mode)));
}

const COACH_LINES = {
  start: 'Tap the mirror the hand points at, and watch the light!',
  firstMove: 'See? The mirror turned and the light bounced! Keep following the hand.',
};

/**
 * mode: 'level' (records progress) | 'daily' (streak + sparks) | 'event' (weekend event puzzle) | 'playtest' (admin preview, free helpers, records nothing)
 * | 'challenge' (a friend's "beat my score" link: no helpers, records nothing; `challenge` is { levelId, moves, name })
 * | 'rush' (Light Rush: no helpers, the run's spare moves set the limit; `rush` is from RushRoute)
 */
export default function PlayScreen({ level, mode = 'level', title, backHref = '#/', nextLevel = null, dateKey, challenge = null, rush = null }) {
  const { progress, finishLevel, finishDaily, finishEventLevel, consumeHelper } = usePlayer();
  const { levelRefsInWorld } = useLevels();
  const puzzle = usePuzzle(level);
  const { trace, moves } = puzzle;
  const [result, setResult] = useState(null);
  const [solvedStars, setSolvedStars] = useState(0);

  // A Glowbug naps on some levels until you rescue it with three stars (glowbugs.js).
  const glowbug = useMemo(
    () => (mode === 'level' && (progress.levels[level.id]?.stars ?? 0) < 3 ? glowbugForLevel(level.id) : null),
    [mode, level.id],
  ); // eslint-disable-line react-hooks/exhaustive-deps
  const [glowbugCell, setGlowbugCell] = useState(null);
  useEffect(() => {
    setGlowbugCell(null);
    if (!glowbug) return undefined;
    // Finding its cell runs the solver, so it happens just after the level appears.
    const timer = setTimeout(() => setGlowbugCell(glowbugCellOf(level)), 60);
    return () => clearTimeout(timer);
  }, [glowbug, level]);
  const litCells = useMemo(() => cellsOnBeams(trace.segments, level.width, level.height), [trace, level]);
  const isGlowbugAwake = glowbugCell !== null && litCells.has(glowbugCell);
  useEffect(() => {
    if (isGlowbugAwake) sfx.sparkle();
  }, [isGlowbugAwake]);
  const [isOutOfMoves, setIsOutOfMoves] = useState(false);
  const [rushOver, setRushOver] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  // Pieces this player meets for the first time get a "New piece!" card before the level starts.
  const [newPieces, setNewPieces] = useState(() => piecesToIntroduce(level, mode, progress));
  // The spotlight tour shown right after the intro: new pieces on the board, then one-time tips.
  const [tour, setTour] = useState({ steps: [], index: 0 });
  const [spotlightTile, setSpotlightTile] = useState(-1);
  const [lumi, setLumi] = useState({ mood: 'happy', line: '' });
  const [buyingHelper, setBuyingHelper] = useState(null);
  const [isConfirmingSkip, setIsConfirmingSkip] = useState(false);
  const [isHintAfterRetry, setIsHintAfterRetry] = useState(false);
  const lastLitCount = useRef(0);
  const lastShadeCount = useRef(0);
  const hasRecordedWin = useRef(false);
  const boardAreaRef = useRef(null);
  const [combo, setCombo] = useState(null);
  const [palReaction, setPalReaction] = useState(null);
  const react = useCallback((name) => setPalReaction({ name, key: Date.now() }), []);

  const modifier = useMemo(() => levelModifierFor(level), [level]);
  const isFirstSteps = isFirstStepsLevel(level, mode);
  const flavor = recipeOf(level);
  const moveLimit = mode === 'rush' ? rushMoveLimit(rush.run, level.par) : moveLimitFor(level.par, level.difficulty);
  const gems = level.tiles.map((tile, i) => ({ tile, i })).filter(({ tile }) => tile.type === TILE.GEM);
  const helpersAllowed = helpersAllowedFor(level.difficulty);
  // Daily and event puzzles can't be skipped.
  const offeredHelpers =
    mode === 'challenge' || mode === 'rush' ? [] : mode === 'daily' || mode === 'event' ? HELPER_IDS.filter((id) => id !== 'skip') : HELPER_IDS;
  const levelName = title || levelNameFor(level);
  const levelLabel = `${level.world}-${level.index}`;
  // Built-in worlds have their own look (board colors and landscape) and show their name.
  const world = ['level', 'challenge', 'rush'].includes(mode) ? WORLDS[level.world - 1] : null;
  const backName = mode === 'event' ? 'event' : mode === 'rush' ? 'Light Rush' : 'map';
  const eventSpot = useMemo(() => (mode === 'event' ? parseEventLevelId(level.id) : null), [mode, level.id]);
  const subtitle = level.isDaily
    ? 'Daily puzzle'
    : eventSpot
      ? `Weekend event · ${eventSpot.number}/${EVENT_LEVELS}`
      : mode === 'playtest'
        ? 'Test play'
        : mode === 'challenge'
          ? `Challenge from ${challenge.name ?? 'a friend'}`
          : mode === 'rush'
            ? `Light Rush · ${rush.number}/${RUSH_LENGTH}`
            : `${world ? `${world.name} · ` : ''}${level.world}-${level.index}`;
  const introLine = useMemo(
    () =>
      challenge
        ? `Beat ${challenge.moves} moves! Fewer moves wins.`
        : rush
          ? `Puzzle ${rush.number}: ${rush.run.spare} spare moves left. Make them count!`
          : quipFor(modifier === 'normal' ? 'start' : modifier),
    [modifier, challenge], // eslint-disable-line react-hooks/exhaustive-deps -- the rush line is set once per puzzle
  );
  const isOver = trace.isSolved || isOutOfMoves || Boolean(result);

  const say = useCallback((mood, event) => setLumi({ mood, line: event ? quipFor(event) : '' }), []);
  const playStats = usePlayStats(level.id, mode === 'level', moves);

  // Reset per level.
  useEffect(() => {
    setResult(null);
    setIsOutOfMoves(false);
    setShowIntro(true);
    setNewPieces(piecesToIntroduce(level, mode, progress));
    setSpotlightTile(-1);
    setLumi({ mood: 'happy', line: '' });
    hasRecordedWin.current = false;
  }, [level.id]);

  // Lens ghost path fades after a few seconds.
  useEffect(() => {
    if (!puzzle.ghostSegments) return undefined;
    const timer = setTimeout(puzzle.clearGhost, LENS_DURATION_MS);
    return () => clearTimeout(timer);
  }, [puzzle.ghostSegments, puzzle.clearGhost]);

  // Nothing happening for a while: Lumi suggests a Hint and the Hint button wiggles (where helpers are on).
  const [isNudgingHint, setIsNudgingHint] = useState(false);
  const isTouring = tour.steps.length > 0;
  useEffect(() => {
    setIsNudgingHint(false);
    if (isOver || showIntro || isTouring) return undefined;
    const timer = setTimeout(() => {
      const canHint = !isFirstSteps && offeredHelpers.includes('hint') && puzzle.usedHelpers.length < helpersAllowed;
      if (canHint) {
        setLumi({ mood: 'happy', line: 'Stuck? Tap Hint and I’ll show you a mirror!' });
        setIsNudgingHint(true);
      } else {
        say('sleepy', 'idle');
      }
    }, IDLE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [moves, isOver, showIntro, isTouring, say]); // eslint-disable-line react-hooks/exhaustive-deps

  // Feedback as gems light up, shadow crystals are hit, or moves run low.
  useEffect(() => {
    const litCount = trace.litGems.size;
    const shadeCount = trace.litShades.size;
    if (moves === 0) {
      lastLitCount.current = litCount;
      lastShadeCount.current = shadeCount;
      return;
    }
    if (litCount > lastLitCount.current) {
      // Several gems from one tap: a combo!
      const combo = comboFor(litCount - lastLitCount.current);
      if (combo) {
        setCombo({ ...combo, key: Date.now() });
        sfx.combo(combo.size);
      } else {
        sfx.gemLit(litCount);
      }
      say('excited', litCount < gems.length ? (combo ? 'combo' : 'gem') : null);
      react(combo ? 'spin' : 'hop');
    } else if (shadeCount > lastShadeCount.current) {
      sfx.shade();
      say('worried', 'shade');
      react('shake');
    } else if (!trace.isSolved && moves === moveLimit - 1) {
      say('worried', 'lastMove');
      react('shiver');
    } else {
      setLumi((current) => (current.mood === 'sleepy' ? { mood: 'happy', line: '' } : current));
    }
    lastLitCount.current = litCount;
    lastShadeCount.current = shadeCount;
  }, [trace, moves, gems.length, moveLimit, say, react]);

  // First levels: Lumi explains what just happened after the first tap.
  useEffect(() => {
    if (isFirstSteps && moves === 1 && !trace.isSolved) setLumi({ mood: 'excited', line: COACH_LINES.firstMove });
  }, [moves]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Record the result (server-checked when signed in) and celebrate. */
  const completeLevel = useCallback(
    async ({ isSkipped = false } = {}) => {
      if (hasRecordedWin.current) return;
      hasRecordedWin.current = true;
      playStats.end(isSkipped ? 'quit' : 'win');

      const stars = isSkipped ? 1 : Math.min(starsForMoves(moves, level.par, level.difficulty), puzzle.starCap);
      setSolvedStars(stars);
      const isBig = modifier === 'boss' || level.difficulty === DIFFICULTY.EXTRA;
      sfx.win({ stars, isBig });
      if (!isSkipped) celebrate({ stars, isBig, from: boardAreaRef.current });
      say(stars === 3 ? 'dance' : 'excited', isSkipped ? null : `win${stars}`);
      react('dance');
      const worldRefs = mode === 'level' ? levelRefsInWorld(level.world) : [];
      const wasWorldComplete = isWorldComplete(progress, worldRefs);
      const usedHelpers = puzzle.usedHelpers.length > 0;

      let outcome;
      if (mode === 'level') {
        outcome = finishLevel(
          level,
          isSkipped ? { moves: null, forcedStars: 1, usedHelpers: true } : { moves, starCap: puzzle.starCap, usedHelpers },
        );
      } else if (mode === 'event') {
        outcome = finishEventLevel(level, { ...eventSpot, moves, starCap: puzzle.starCap });
      } else if (mode === 'rush') {
        const spareBefore = rush.run.spare;
        outcome = rush.onSolved(moves).then((rushOutcome) => ({ stars, sparksEarned: rushOutcome.sparksWon, rush: { ...rushOutcome, spareBefore } }));
      } else if (mode === 'daily') {
        outcome = finishDaily(dateKey).then((daily) => ({ ...daily, stars, isNewBest: false }));
      } else {
        outcome = Promise.resolve({ stars, sparksEarned: 0, diamondsEarned: 0, isNewBest: false });
      }
      const [finished] = await Promise.all([outcome, wait(WIN_DIALOG_DELAY_MS)]);
      const solvedLevels = { ...progress.levels, [level.id]: { stars } };
      const completesWorld = mode === 'level' && !wasWorldComplete && isWorldComplete({ levels: solvedLevels }, worldRefs);
      const glowbugResult = glowbug && {
        id: glowbug.id,
        isRescued: stars === 3 && !isSkipped,
        isNew: !rescuedGlowbugs(progress.levels).has(glowbug.id),
      };
      // Treats and stickers come from the stars, before and after this solve.
      const levelsAfter = {
        ...progress.levels,
        [level.id]: { ...progress.levels[level.id], stars: Math.max(stars, progress.levels[level.id]?.stars ?? 0) },
      };
      const treat = mode === 'level' ? treatFoundBy(progress.levels, levelsAfter) : null;
      const newStickers = mode === 'level' ? newStickersFor(level.world, progress.levels, levelsAfter) : [];
      const climb = mode === 'level' ? climbFor(progress.levels, levelsAfter) : {};
      setResult({ ...finished, moves: isSkipped ? null : moves, isSkipped, completesWorld, glowbug: glowbugResult, treat, newStickers, ...climb });
    },
    [
      moves,
      level,
      modifier,
      puzzle.starCap,
      puzzle.usedHelpers.length,
      mode,
      levelRefsInWorld,
      progress,
      finishLevel,
      finishDaily,
      finishEventLevel,
      eventSpot,
      dateKey,
      say,
      react,
      glowbug,
      playStats,
    ],
  );

  useEffect(() => {
    if (trace.isSolved) completeLevel();
  }, [trace.isSolved]); // eslint-disable-line react-hooks/exhaustive-deps

  // Out of moves.
  useEffect(() => {
    if (!trace.isSolved && moves >= moveLimit && !hasRecordedWin.current) {
      const timer = setTimeout(() => {
        sfx.outOfMoves();
        say('sad', null);
        react('droop');
        setIsOutOfMoves(true);
        playStats.end('out_of_moves');
      }, 450);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [moves, moveLimit, trace.isSolved, say, react, playStats]);

  const onActivate = useCallback(
    (_cell, tileIndex) => {
      if (isOver || tileIndex < 0 || moves >= moveLimit) return;
      sfx.rotate();
      // A cracking mirror's last turn: crack! (it stays put from now on)
      if (puzzle.turnsLeft[tileIndex] === 1) {
        sfx.crack();
        say('worried', 'crack');
      }
      puzzle.rotate(tileIndex);
    },
    [isOver, moves, moveLimit, puzzle, say],
  );

  const restart = useCallback(() => {
    sfx.restart();
    if (mode === 'rush' && moves > 0) rush.onRestart(moves);
    puzzle.restart();
    playStats.start();
    setResult(null);
    setIsOutOfMoves(false);
    setSolvedStars(0);
    hasRecordedWin.current = false;
    say('happy', 'start');
    setPalReaction(null);
  }, [puzzle, say, playStats, mode, moves, rush]);

  /** Spend one helper from the inventory (free in playtest) and apply it. */
  const spendHelper = useCallback(
    async (helperId) => {
      try {
        if (mode !== 'playtest') await consumeHelper(helperId);
      } catch (error) {
        setLumi({ mood: 'worried', line: error.message });
        return;
      }
      puzzle.applyHelper(helperId);
      sfx.helper();
      const lines = {
        hint: 'Psst! Rotate the glowing one.',
        lens: 'Follow the dotted path. Quick!',
        autoturn: 'Zap! I turned one for you.',
      };
      if (lines[helperId]) setLumi({ mood: 'excited', line: lines[helperId] });
      if (helperId === 'skip') completeLevel({ isSkipped: true });
    },
    [mode, consumeHelper, puzzle, completeLevel],
  );

  const requestHelper = useCallback(
    (helperId) => {
      if (isOver) return;
      if (puzzle.usedHelpers.length >= helpersAllowed) {
        setLumi({ mood: 'worried', line: `Only ${helpersAllowed} helper${helpersAllowed === 1 ? '' : 's'} per try here!` });
        return;
      }
      if (helperId === 'autoturn' && moves >= moveLimit) return;
      const owned = progress.helpers[helperId] ?? 0;
      if (mode !== 'playtest' && owned < 1) {
        setBuyingHelper(helperId);
        return;
      }
      if (helperId === 'skip') setIsConfirmingSkip(true);
      else spendHelper(helperId);
    },
    [isOver, puzzle.usedHelpers.length, helpersAllowed, moves, moveLimit, progress.helpers, mode, spendHelper],
  );

  // "Try again with a hint": once the board has reset, spend the hint.
  useEffect(() => {
    if (isHintAfterRetry && !isOver) {
      setIsHintAfterRetry(false);
      requestHelper('hint');
    }
  }, [isHintAfterRetry, isOver, requestHelper]);

  // Keyboard shortcuts: R restart, H hint.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target.closest?.('[role="dialog"]') || event.metaKey || event.ctrlKey || event.altKey || showIntro) return;
      if (event.key === 'r' || event.key === 'R') restart();
      if (event.key === 'h' || event.key === 'H') requestHelper('hint');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [restart, requestHelper, showIntro]);

  /** Spotlights for this level: each new piece where it sits on the board, then any first-time tips. */
  const buildTour = () => {
    const pieceSteps = newPieces.map((piece) => {
      const tile = level.tiles[firstTileOf(level, piece.id)];
      return {
        id: `piece-${piece.id}`,
        target: tile ? `[data-cell="${tile.y * level.width + tile.x}"]` : '[data-tour="board"]',
        title: piece.name,
        text: piece.text,
        art: (
          <TileArt
            tile={piece.sample}
            turns={piece.sample.orient ?? 0}
            isLit={piece.sample.type === 'gem'}
            isRotatable={false}
            isFogged={Boolean(piece.sample.fog)}
          />
        ),
      };
    });
    const showsTips = ['level', 'daily', 'event'].includes(mode) && !isFirstSteps && pieceSteps.length === 0;
    const tipSteps = showsTips ? unseenTips(readJson(SEEN_TIPS_KEY, []), { hasHelpers: offeredHelpers.length > 0 }) : [];
    return [...pieceSteps, ...tipSteps];
  };

  const finishTour = () => {
    if (newPieces.length) {
      writeJson(SEEN_PIECES_KEY, [...seenPieces(progress), ...newPieces.map((piece) => piece.id)]);
      // Keep a soft glow on the newest piece until the first move.
      setSpotlightTile(firstTileOf(level, newPieces[newPieces.length - 1].id));
      setNewPieces([]);
    }
    const tipIds = tour.steps.filter((step) => !step.id.startsWith('piece-')).map((step) => step.id);
    if (tipIds.length) writeJson(SEEN_TIPS_KEY, [...new Set([...readJson(SEEN_TIPS_KEY, []), ...tipIds])]);
    setTour({ steps: [], index: 0 });
  };

  const nextTourStep = () => {
    if (tour.index < tour.steps.length - 1) setTour({ ...tour, index: tour.index + 1 });
    else finishTour();
  };

  // In-level sounds speak in this world's voice (a desert pluck, lagoon drops…); back to normal after.
  useEffect(() => {
    sfx.setWorldVoice(world?.theme ?? null);
    return () => sfx.setWorldVoice(null);
  }, [world?.theme]);

  // Light Rush: every move is saved with the run (leaving mid-puzzle spends them), and running out ends the run.
  useEffect(() => {
    if (mode === 'rush' && !trace.isSolved) rush.onMove(moves);
  }, [moves]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (mode !== 'rush' || !isOutOfMoves) return;
    rush.onRunOver().then(setRushOver);
  }, [isOutOfMoves]); // eslint-disable-line react-hooks/exhaustive-deps

  // Soft background music in this world's voice while the level is being played; it fades out for the win.
  const isMusicPlaying = !showIntro && !isOver;
  useEffect(() => {
    if (!isMusicPlaying) return undefined;
    music.play(world?.theme ?? null);
    return () => music.stop();
  }, [isMusicPlaying, world?.theme]);

  const dismissIntro = useCallback(() => {
    sfx.unlock();
    sfx.levelStart();
    playStats.start();
    setShowIntro(false);
    setTour({ steps: buildTour(), index: 0 });
    if (isFirstSteps) {
      // The basics are taught right here on the board, so they count as met.
      writeJson(SEEN_PIECES_KEY, [...new Set([...seenPieces(progress), 'basics'])]);
      setLumi({ mood: 'excited', line: COACH_LINES.start });
    } else if (flavor) {
      setLumi({ mood: 'happy', line: flavor.goal });
    }
  }, [playStats, isFirstSteps, flavor, progress, newPieces, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // First levels: a hand points at the next mirror to turn.
  const coachTile = useMemo(
    () => (isFirstSteps && !showIntro && !isOver ? findHint(level, puzzle.orients) : null),
    [isFirstSteps, showIntro, isOver, level, puzzle.orients],
  );

  return (
    <main className={`${styles.screen} ${styles[modifier] ?? ''} ${world ? `${styles.themed} ${styles[world.theme]}` : ''}`}>
      {world && <WorldBackdrop levelId={level.id} theme={world.theme} />}
      <header className={styles.header}>
        <Button as="a" href={backHref} variant="secondary" icon="back" label={`Back to ${backName}`} />
        <div className={styles.titleBlock}>
          <p className={styles.subtitle}>{subtitle}</p>
          <ScreenTitle as="h1" size="sm" tone={modifier === 'boss' ? 'boss' : 'calm'}>
            {levelName}
          </ScreenTitle>
        </div>
        <span className={styles.headerSpacer} aria-hidden="true" />
      </header>

      <section className={styles.status} aria-label="Level status" data-tour="meter">
        <StarMeter moves={moves} par={level.par} limit={moveLimit} starCap={puzzle.starCap} isSimple={isFirstSteps} />
        <ul className={styles.gems} aria-label={`${trace.litGems.size} of ${gems.length} gems lit`}>
          {gems.map(({ tile, i }) => (
            <li key={i} className={trace.litGems.has(i) ? styles.gemOn : styles.gemOff}>
              <GemShape color={tile.color} size={24} />
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.boardArea} ref={boardAreaRef} data-tour="board">
        {combo && <ComboBurst combo={combo} />}
        {mode !== 'playtest' && <PalBuddy reaction={palReaction} />}
        <Board
          level={level}
          orients={puzzle.orients}
          turns={puzzle.turns}
          trace={trace}
          onActivate={onActivate}
          highlightTile={puzzle.hintTile}
          spotlightTile={moves === 0 && spotlightTile >= 0 ? spotlightTile : null}
          ghostSegments={puzzle.ghostSegments}
          coach={isFirstSteps ? { tile: coachTile, labels: true } : null}
          turnsLeft={puzzle.turnsLeft}
          revealedCells={puzzle.revealedCells}
          glowbug={
            glowbug && glowbugCell !== null ? { id: glowbug.id, cell: glowbugCell, isAwake: isGlowbugAwake, isFreed: solvedStars === 3 } : null
          }
          isLocked={isOver}
          mood={modifier}
          label={`${levelName} board. Use arrow keys to move, Enter to rotate.`}
        />
      </div>

      <SpeechBox line={lumi.line} tail="down" className={styles.speech} />
      <div className={styles.bottom}>
        <div className={styles.lumi}>
          <Lumi mood={lumi.mood} size={96} />
        </div>
        <div className={styles.controls}>
          <Button variant="secondary" icon="restart" label="Restart level" onClick={restart} />
          {!isFirstSteps && (
            <div data-tour="helpers">
              <HelperBar
                helperIds={offeredHelpers}
                inventory={progress.helpers}
                usedCount={puzzle.usedHelpers.length}
                allowed={helpersAllowed}
                disabled={isOver}
                onUse={requestHelper}
                nudgeId={isNudgingHint ? 'hint' : null}
              />
            </div>
          )}
        </div>
      </div>

      {tour.steps.length > 0 && (
        <Spotlight key={tour.steps[tour.index].id} {...tour.steps[tour.index]} step={tour.index} total={tour.steps.length} onNext={nextTourStep} />
      )}
      {showIntro && (
        <LevelIntro
          level={level}
          title={levelName}
          subtitle={subtitle}
          modifier={modifier}
          lumiLine={introLine}
          moveLimit={moveLimit}
          flavor={flavor}
          waitsForTap={isFirstSteps}
          glowbugId={glowbug?.id}
          onDone={dismissIntro}
        />
      )}
      {buyingHelper && (
        <QuickBuyDialog
          helperId={buyingHelper}
          onClose={() => setBuyingHelper(null)}
          onBought={() => {
            const helperId = buyingHelper;
            setBuyingHelper(null);
            if (helperId === 'skip') setIsConfirmingSkip(true);
            else spendHelper(helperId);
          }}
        />
      )}
      {isConfirmingSkip && (
        <Dialog title="Skip this level?" onClose={() => setIsConfirmingSkip(false)}>
          <p className={styles.dialogText}>{HELPERS.skip.description} You can come back for more stars any time.</p>
          <div className={styles.dialogActions}>
            <Button variant="secondary" onClick={() => setIsConfirmingSkip(false)} data-autofocus>
              Keep trying
            </Button>
            <Button
              icon="skip"
              onClick={() => {
                setIsConfirmingSkip(false);
                spendHelper('skip');
              }}
            >
              Skip
            </Button>
          </div>
        </Dialog>
      )}
      {isOutOfMoves && !result && mode === 'rush' && rushOver && (
        <RushOverDialog {...rushOver} onNewRun={rush.onNewRun} onBack={() => navigate(backHref)} />
      )}
      {result && mode === 'rush' && (
        <RushClearedDialog
          number={rush.number}
          par={level.par}
          moves={result.moves}
          spareBefore={result.rush.spareBefore}
          outcome={result.rush}
          onNext={rush.onNext}
          onBack={() => navigate(backHref)}
        />
      )}
      {isOutOfMoves && !result && mode !== 'rush' && (
        <OutOfMovesDialog
          backName={backName}
          gemsLeft={gems.length - trace.litGems.size}
          lumiLine={quipFor('outOfMoves')}
          hintsOwned={progress.helpers.hint ?? 0}
          onRetry={restart}
          onRetryWithHint={
            offeredHelpers.includes('hint') && helpersAllowed > 0
              ? () => {
                  restart();
                  setIsHintAfterRetry(true);
                }
              : null
          }
          onMap={() => navigate(backHref)}
        />
      )}
      {result && mode === 'challenge' && (
        <ChallengeResultDialog
          challenge={challenge}
          levelLabel={levelLabel}
          stars={result.stars}
          moves={result.moves}
          onRetry={restart}
          onHome={() => navigate('#/')}
        />
      )}
      {result && mode !== 'challenge' && mode !== 'rush' && (
        <WinDialog
          challenge={mode === 'level' && !result.isSkipped && !isFirstSteps ? { levelId: level.id, levelLabel, moves: result.moves } : null}
          backName={backName}
          replay={mode === 'playtest' || isFirstSteps ? null : { level, history: puzzle.history, title: levelName, subtitle }}
          result={result}
          par={level.par}
          difficulty={level.difficulty}
          hotStreak={progress.hotStreak}
          hasNext={Boolean(nextLevel)}
          shareMessage={
            mode === 'daily' && !result.isSkipped
              ? dailyShareText({
                  dateKey,
                  stars: result.stars,
                  moves: result.moves,
                  par: level.par,
                  streak: result.streak ?? progress.daily.streak,
                  url: PUBLIC_GAME_URL,
                })
              : null
          }
          // No partner yet (a new player's first win): meet the Pals on the map before going on.
          nextLabel={mode === 'level' && !progress.pal.id ? 'Meet your Pal friend' : 'Next level'}
          onNext={() => (mode === 'level' && !progress.pal.id ? navigate('#/') : nextLevel && navigate(nextLevel))}
          onReplay={restart}
          onMap={() => navigate(backHref)}
        />
      )}
    </main>
  );
}
