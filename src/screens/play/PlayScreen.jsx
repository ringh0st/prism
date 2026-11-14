import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Board from '../../components/board/Board.jsx';
import Button from '../../components/Button.jsx';
import Dialog from '../../components/Dialog.jsx';
import ScreenTitle from '../../components/game/ScreenTitle.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import { celebrate } from '../../lib/effects.js';
import GemShape from '../../components/GemShape.jsx';
import HelperBar from '../../components/HelperBar.jsx';
import QuickBuyDialog from '../../components/QuickBuyDialog.jsx';
import StarMeter from './StarMeter.jsx';
import LevelIntro from './LevelIntro.jsx';
import OutOfMovesDialog from './OutOfMovesDialog.jsx';
import WinDialog from './WinDialog.jsx';
import { usePuzzle } from '../../hooks/usePuzzle.js';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { useLevels } from '../../state/LevelsContext.jsx';
import { navigate } from '../../hooks/useHashRoute.js';
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
import styles from './PlayScreen.module.css';

const WIN_DIALOG_DELAY_MS = 900;
const IDLE_AFTER_MS = 15000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * mode: 'level' (records progress) | 'daily' (streak + sparks) | 'playtest' (admin preview, free helpers, records nothing)
 */
export default function PlayScreen({ level, mode = 'level', title, backHref = '#/', nextLevel = null, dateKey }) {
  const { progress, finishLevel, finishDaily, consumeHelper } = usePlayer();
  const { levelRefsInWorld } = useLevels();
  const puzzle = usePuzzle(level);
  const { trace, moves } = puzzle;
  const [result, setResult] = useState(null);
  const [isOutOfMoves, setIsOutOfMoves] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [lumi, setLumi] = useState({ mood: 'happy', line: '' });
  const [buyingHelper, setBuyingHelper] = useState(null);
  const [isConfirmingSkip, setIsConfirmingSkip] = useState(false);
  const [isHintAfterRetry, setIsHintAfterRetry] = useState(false);
  const lastLitCount = useRef(0);
  const lastShadeCount = useRef(0);
  const hasRecordedWin = useRef(false);
  const boardAreaRef = useRef(null);

  const modifier = useMemo(() => levelModifierFor(level), [level]);
  const moveLimit = moveLimitFor(level.par, level.difficulty);
  const gems = level.tiles.map((tile, i) => ({ tile, i })).filter(({ tile }) => tile.type === TILE.GEM);
  const helpersAllowed = helpersAllowedFor(level.difficulty);
  const offeredHelpers = mode === 'daily' ? HELPER_IDS.filter((id) => id !== 'skip') : HELPER_IDS;
  const levelName = title || levelNameFor(level);
  const subtitle = level.isDaily ? 'Daily puzzle' : mode === 'playtest' ? 'Test play' : `Level ${level.world}-${level.index}`;
  const introLine = useMemo(() => quipFor(modifier === 'normal' ? 'start' : modifier), [modifier]);
  const isOver = trace.isSolved || isOutOfMoves || Boolean(result);

  const say = useCallback((mood, event) => setLumi({ mood, line: event ? quipFor(event) : '' }), []);

  // Reset per level.
  useEffect(() => {
    setResult(null);
    setIsOutOfMoves(false);
    setShowIntro(true);
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
      sfx.gemLit(litCount);
      say('excited', litCount < gems.length ? 'gem' : null);
    } else if (shadeCount > lastShadeCount.current) {
      sfx.shade();
      say('worried', 'shade');
    } else if (!trace.isSolved && moves === moveLimit - 1) {
      say('worried', 'lastMove');
    } else {
      setLumi((current) => (current.mood === 'sleepy' ? { mood: 'happy', line: '' } : current));
    }
    lastLitCount.current = litCount;
    lastShadeCount.current = shadeCount;
  }, [trace, moves, gems.length, moveLimit, say]);

  /** Record the result (server-checked when signed in) and celebrate. */
  const completeLevel = useCallback(
    async ({ isSkipped = false } = {}) => {
      if (hasRecordedWin.current) return;
      hasRecordedWin.current = true;

      const stars = isSkipped ? 1 : Math.min(starsForMoves(moves, level.par, level.difficulty), puzzle.starCap);
      const isBig = modifier === 'boss' || level.difficulty === DIFFICULTY.EXTRA;
      sfx.win({ stars, isBig });
      if (!isSkipped) celebrate({ stars, isBig, from: boardAreaRef.current });
      say(stars === 3 ? 'dance' : 'excited', isSkipped ? null : `win${stars}`);
      const worldRefs = mode === 'level' ? levelRefsInWorld(level.world) : [];
      const wasWorldComplete = isWorldComplete(progress, worldRefs);
      const usedHelpers = puzzle.usedHelpers.length > 0;

      let outcome;
      if (mode === 'level') {
        outcome = finishLevel(
          level,
          isSkipped ? { moves: null, forcedStars: 1, usedHelpers: true } : { moves, starCap: puzzle.starCap, usedHelpers },
        );
      } else if (mode === 'daily') {
        outcome = finishDaily(dateKey).then((daily) => ({ ...daily, stars, isNewBest: false }));
      } else {
        outcome = Promise.resolve({ stars, sparksEarned: 0, diamondsEarned: 0, isNewBest: false });
      }
      const [finished] = await Promise.all([outcome, wait(WIN_DIALOG_DELAY_MS)]);
      const solvedLevels = { ...progress.levels, [level.id]: { stars } };
      const completesWorld = mode === 'level' && !wasWorldComplete && isWorldComplete({ levels: solvedLevels }, worldRefs);
      setResult({ ...finished, moves: isSkipped ? null : moves, isSkipped, completesWorld });
    },
    [moves, level, modifier, puzzle.starCap, puzzle.usedHelpers.length, mode, levelRefsInWorld, progress, finishLevel, finishDaily, dateKey, say],
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
        setIsOutOfMoves(true);
      }, 450);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [moves, moveLimit, trace.isSolved, say]);

  const onActivate = useCallback(
    (_cell, tileIndex) => {
      if (isOver || tileIndex < 0 || moves >= moveLimit) return;
      sfx.rotate();
      puzzle.rotate(tileIndex);
    },
    [isOver, moves, moveLimit, puzzle],
  );

  const restart = useCallback(() => {
    sfx.restart();
    puzzle.restart();
    setResult(null);
    setIsOutOfMoves(false);
    hasRecordedWin.current = false;
    say('happy', 'start');
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

  const dismissIntro = useCallback(() => {
    sfx.unlock();
    sfx.levelStart();
    setShowIntro(false);
  }, []);

  return (
    <main className={`${styles.screen} ${styles[modifier] ?? ''}`}>
      <header className={styles.header}>
        <Button as="a" href={backHref} variant="secondary" icon="back" label="Back to map" />
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
        <Board
          level={level}
          orients={puzzle.orients}
          turns={puzzle.turns}
          trace={trace}
          onActivate={onActivate}
          highlightTile={puzzle.hintTile}
          ghostSegments={puzzle.ghostSegments}
          isLocked={isOver}
          mood={modifier}
          label={`${levelName} board. Use arrow keys to move, Enter to rotate.`}
        />
      </div>

      <div className={styles.bottom}>
        <div className={styles.lumi}>
          <Lumi mood={lumi.mood} size={96} line={lumi.line} bubbleSide="above" />
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

      {showIntro && <LevelIntro level={level} title={levelName} subtitle={subtitle} modifier={modifier} lumiLine={introLine} onDone={dismissIntro} />}
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
