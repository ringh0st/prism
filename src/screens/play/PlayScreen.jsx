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
import NewPieceDialog from './NewPieceDialog.jsx';
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
import { readJson, writeJson } from '../../lib/storage.js';
import { EVENT_LEVELS, parseEventLevelId } from '../../game/events.js';
import ComboBurst from './ComboBurst.jsx';
import { treatFoundBy } from '../../game/treats.js';
import { newStickersFor } from '../../game/stickers.js';
import { climbFor } from '../../game/titles.js';
import { glowbugCellOf, glowbugForLevel, rescuedGlowbugs } from '../../game/glowbugs.js';
import { cellsOnBeams } from '../../game/beam.js';
import PalBuddy from './PalBuddy.jsx';
import { comboFor } from '../../game/combos.js';
import styles from './PlayScreen.module.css';

const WIN_DIALOG_DELAY_MS = 900;
const IDLE_AFTER_MS = 15000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SEEN_PIECES_KEY = 'prism.seenPieces.v1';

/** Pieces already introduced on this device, or (first time) the ones met in levels already solved. */
function seenPieces(progress) {
  return readJson(SEEN_PIECES_KEY, null) ?? piecesMetIn(progress.levels);
}

/**
 * mode: 'level' (records progress) | 'daily' (streak + sparks) | 'event' (weekend event puzzle) | 'playtest' (admin preview, free helpers, records nothing)
 */
export default function PlayScreen({ level, mode = 'level', title, backHref = '#/', nextLevel = null, dateKey }) {
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
  const [showIntro, setShowIntro] = useState(true);
  // Pieces this player meets for the first time get a "New piece!" card before the level starts.
  const [newPieces, setNewPieces] = useState(() => (mode === 'playtest' ? [] : newPiecesIn(level, seenPieces(progress))));
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
  const moveLimit = moveLimitFor(level.par, level.difficulty);
  const gems = level.tiles.map((tile, i) => ({ tile, i })).filter(({ tile }) => tile.type === TILE.GEM);
  const helpersAllowed = helpersAllowedFor(level.difficulty);
  // Daily and event puzzles can't be skipped.
  const offeredHelpers = mode === 'daily' || mode === 'event' ? HELPER_IDS.filter((id) => id !== 'skip') : HELPER_IDS;
  const levelName = title || levelNameFor(level);
  // Built-in worlds have their own look (board colors and landscape) and show their name.
  const world = mode === 'level' ? WORLDS[level.world - 1] : null;
  const backName = mode === 'event' ? 'event' : 'map';
  const eventSpot = useMemo(() => (mode === 'event' ? parseEventLevelId(level.id) : null), [mode, level.id]);
  const subtitle = level.isDaily
    ? 'Daily puzzle'
    : eventSpot
      ? `Weekend event · ${eventSpot.number}/${EVENT_LEVELS}`
      : mode === 'playtest'
        ? 'Test play'
        : `${world ? `${world.name} · ` : ''}${level.world}-${level.index}`;
  const introLine = useMemo(() => quipFor(modifier === 'normal' ? 'start' : modifier), [modifier]);
  const isOver = trace.isSolved || isOutOfMoves || Boolean(result);

  const say = useCallback((mood, event) => setLumi({ mood, line: event ? quipFor(event) : '' }), []);

  // Reset per level.
  useEffect(() => {
    setResult(null);
    setIsOutOfMoves(false);
    setShowIntro(true);
    setNewPieces(mode === 'playtest' ? [] : newPiecesIn(level, seenPieces(progress)));
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

  // Lumi dozes off if nothing happens for a while.
  useEffect(() => {
    if (isOver || showIntro) return undefined;
    const timer = setTimeout(() => say('sleepy', 'idle'), IDLE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [moves, isOver, showIntro, say]);

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

  /** Record the result (server-checked when signed in) and celebrate. */
  const completeLevel = useCallback(
    async ({ isSkipped = false } = {}) => {
      if (hasRecordedWin.current) return;
      hasRecordedWin.current = true;

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
      }, 450);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [moves, moveLimit, trace.isSolved, say, react]);

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
    puzzle.restart();
    setResult(null);
    setIsOutOfMoves(false);
    setSolvedStars(0);
    hasRecordedWin.current = false;
    say('happy', 'start');
    setPalReaction(null);
  }, [puzzle, say]);

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

  const finishPieceIntro = () => {
    writeJson(SEEN_PIECES_KEY, [...seenPieces(progress), ...newPieces.map((piece) => piece.id)]);
    // Point at the newest piece on the board until the first move.
    setSpotlightTile(firstTileOf(level, newPieces[newPieces.length - 1].id));
    setNewPieces([]);
  };

  // In-level sounds speak in this world's voice (a desert pluck, lagoon drops…); back to normal after.
  useEffect(() => {
    sfx.setWorldVoice(world?.theme ?? null);
    return () => sfx.setWorldVoice(null);
  }, [world?.theme]);

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
    setShowIntro(false);
  }, []);

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

      <section className={styles.status} aria-label="Level status">
        <StarMeter moves={moves} par={level.par} difficulty={level.difficulty} starCap={puzzle.starCap} />
        <ul className={styles.gems} aria-label={`${trace.litGems.size} of ${gems.length} gems lit`}>
          {gems.map(({ tile, i }) => (
            <li key={i} className={trace.litGems.has(i) ? styles.gemOn : styles.gemOff}>
              <GemShape color={tile.color} size={24} />
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.boardArea} ref={boardAreaRef}>
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
          <HelperBar
            helperIds={offeredHelpers}
            inventory={progress.helpers}
            usedCount={puzzle.usedHelpers.length}
            allowed={helpersAllowed}
            disabled={isOver}
            onUse={requestHelper}
          />
        </div>
      </div>

      {newPieces.length > 0 && <NewPieceDialog pieces={newPieces} onDone={finishPieceIntro} />}
      {showIntro && newPieces.length === 0 && (
        <LevelIntro
          level={level}
          title={levelName}
          subtitle={subtitle}
          modifier={modifier}
          lumiLine={introLine}
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
      {isOutOfMoves && !result && (
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
      {result && (
        <WinDialog
          backName={backName}
          replay={mode === 'playtest' ? null : { level, history: puzzle.history, title: levelName, subtitle }}
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
          onNext={() => nextLevel && navigate(nextLevel)}
          onReplay={restart}
          onMap={() => navigate(backHref)}
        />
      )}
    </main>
  );
}
