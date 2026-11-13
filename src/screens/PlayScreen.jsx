import { useCallback, useEffect, useRef, useState } from 'react';
import Board from '../components/board/Board.jsx';
import Button from '../components/Button.jsx';
import Dialog from '../components/Dialog.jsx';
import WalletLink from '../components/WalletLink.jsx';
import DifficultyBadge from '../components/DifficultyBadge.jsx';
import Confetti from '../components/Confetti.jsx';
import GemShape from '../components/GemShape.jsx';
import HelperBar from '../components/HelperBar.jsx';
import QuickBuyDialog from '../components/QuickBuyDialog.jsx';
import WinDialog from './WinDialog.jsx';
import { usePuzzle } from '../hooks/usePuzzle.js';
import { usePlayer } from '../state/PlayerContext.jsx';
import { useLevels } from '../state/LevelsContext.jsx';
import { navigate } from '../hooks/useHashRoute.js';
import { sfx } from '../audio/sfx.js';
import { starsForMoves } from '../game/scoring.js';
import { HELPER_IDS, HELPERS, LENS_DURATION_MS, helpersAllowedFor } from '../game/catalog.js';
import { isWorldComplete } from '../game/progress.js';
import { TILE } from '../game/constants.js';
import styles from './PlayScreen.module.css';

const WIN_DIALOG_DELAY_MS = 900;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * mode: 'level' (records progress) | 'daily' (streak + sparks) | 'playtest' (admin preview, free helpers, records nothing)
 */
export default function PlayScreen({ level, mode = 'level', title, backHref = '#/', nextLevel = null, dateKey }) {
  const { progress, finishLevel, finishDaily, consumeHelper } = usePlayer();
  const { levelsInWorld } = useLevels();
  const puzzle = usePuzzle(level);
  const { trace, moves } = puzzle;
  const [result, setResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [message, setMessage] = useState('');
  const [buyingHelper, setBuyingHelper] = useState(null);
  const [isConfirmingSkip, setIsConfirmingSkip] = useState(false);
  const lastLitCount = useRef(0);
  const lastShadeCount = useRef(0);
  const hasRecordedWin = useRef(false);

  const gems = level.tiles.map((tile, i) => ({ tile, i })).filter(({ tile }) => tile.type === TILE.GEM);
  const helpersAllowed = helpersAllowedFor(level.difficulty);
  const offeredHelpers = mode === 'daily' ? HELPER_IDS.filter((id) => id !== 'skip') : HELPER_IDS;

  // Reset per level.
  useEffect(() => {
    setResult(null);
    setShowConfetti(false);
    setMessage('');
    hasRecordedWin.current = false;
  }, [level.id]);

  // Lens ghost path fades after a few seconds.
  useEffect(() => {
    if (!puzzle.ghostSegments) return undefined;
    const timer = setTimeout(puzzle.clearGhost, LENS_DURATION_MS);
    return () => clearTimeout(timer);
  }, [puzzle.ghostSegments, puzzle.clearGhost]);

  // Feedback as gems light up or a shadow crystal is hit. Before the first move
  // we only record the starting state, so opening a level stays quiet.
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
      setMessage(`${litCount} of ${gems.length} gems lit.`);
    }
    if (shadeCount > lastShadeCount.current) {
      sfx.warning();
      setMessage('A shadow crystal is lit. Keep it dark!');
    }
    lastLitCount.current = litCount;
    lastShadeCount.current = shadeCount;
  }, [trace, moves, gems.length]);

  /** Record the result (server-checked when signed in) and celebrate. */
  const completeLevel = useCallback(
    async ({ isSkipped = false } = {}) => {
      if (hasRecordedWin.current) return;
      hasRecordedWin.current = true;
      sfx.win();
      setShowConfetti(!isSkipped);
      setMessage(isSkipped ? 'Level skipped.' : 'Solved!');

      const stars = isSkipped ? 1 : Math.min(starsForMoves(moves, level.par), puzzle.starCap);
      const worldLevels = mode === 'level' ? levelsInWorld(level.world) : [];
      const wasWorldComplete = isWorldComplete(progress, worldLevels);

      let outcome;
      if (mode === 'level') {
        outcome = finishLevel(level, isSkipped ? { moves: null, forcedStars: 1 } : { moves, starCap: puzzle.starCap });
      } else if (mode === 'daily') {
        outcome = finishDaily(dateKey).then((daily) => ({ ...daily, stars, isNewBest: false }));
      } else {
        outcome = Promise.resolve({ stars, sparksEarned: 0, diamondsEarned: 0, isNewBest: false });
      }
      const [finished] = await Promise.all([outcome, wait(WIN_DIALOG_DELAY_MS)]);
      const solvedLevels = { ...progress.levels, [level.id]: { stars } };
      const completesWorld = mode === 'level' && !wasWorldComplete && isWorldComplete({ levels: solvedLevels }, worldLevels);
      setResult({ ...finished, moves: isSkipped ? null : moves, isSkipped, completesWorld });
    },
    [moves, level, puzzle.starCap, mode, levelsInWorld, progress, finishLevel, finishDaily, dateKey],
  );

  useEffect(() => {
    if (trace.isSolved) completeLevel();
  }, [trace.isSolved]); // eslint-disable-line react-hooks/exhaustive-deps

  const onActivate = useCallback(
    (_cell, tileIndex) => {
      if (trace.isSolved || tileIndex < 0) return;
      sfx.rotate();
      puzzle.rotate(tileIndex);
    },
    [trace.isSolved, puzzle],
  );

  const restart = useCallback(() => {
    sfx.tap();
    puzzle.restart();
    setResult(null);
    setShowConfetti(false);
    hasRecordedWin.current = false;
    setMessage('Level restarted.');
  }, [puzzle]);

  /** Spend one helper from the inventory (free in playtest) and apply it. */
  const spendHelper = useCallback(
    async (helperId) => {
      try {
        if (mode !== 'playtest') await consumeHelper(helperId);
      } catch (error) {
        setMessage(error.message);
        return;
      }
      puzzle.applyHelper(helperId);
      sfx.sparkle();
      const effects = {
        hint: 'Hint: rotate the glowing piece.',
        lens: 'Lens: follow the faint path.',
        autoturn: 'Auto-turn rotated a piece for you.',
        skip: '',
      };
      setMessage(effects[helperId]);
      if (helperId === 'skip') completeLevel({ isSkipped: true });
    },
    [mode, consumeHelper, puzzle, completeLevel],
  );

  const requestHelper = useCallback(
    (helperId) => {
      if (trace.isSolved) return;
      if (puzzle.usedHelpers.length >= helpersAllowed) {
        setMessage(`Only ${helpersAllowed} helper${helpersAllowed === 1 ? '' : 's'} per try on this level.`);
        return;
      }
      const owned = progress.helpers[helperId] ?? 0;
      if (mode !== 'playtest' && owned < 1) {
        setBuyingHelper(helperId);
        return;
      }
      if (helperId === 'skip') setIsConfirmingSkip(true);
      else spendHelper(helperId);
    },
    [trace.isSolved, puzzle.usedHelpers.length, helpersAllowed, progress.helpers, mode, spendHelper],
  );

  // Keyboard shortcuts: R restart, H hint.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target.closest?.('[role="dialog"]') || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'r' || event.key === 'R') restart();
      if (event.key === 'h' || event.key === 'H') requestHelper('hint');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [restart, requestHelper]);

  const projectedStars = Math.min(starsForMoves(Math.max(moves, level.par), level.par), puzzle.starCap);
  const heading = title || level.name || `Level ${level.world}-${level.index}`;

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <Button as="a" href={backHref} variant="secondary" icon="back" label="Back to map" />
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{heading}</h1>
          <DifficultyBadge difficulty={level.difficulty} />
        </div>
        <WalletLink />
      </header>

      <section className={styles.status} aria-label="Level status">
        <div className={styles.moves}>
          <span className={styles.statLabel}>Moves</span>
          <span className={styles.statValue} key={moves}>
            {moves}
          </span>
        </div>
        <ul className={styles.gems} aria-label={`${trace.litGems.size} of ${gems.length} gems lit`}>
          {gems.map(({ tile, i }) => (
            <li key={i} className={trace.litGems.has(i) ? styles.gemOn : styles.gemOff}>
              <GemShape color={tile.color} size={22} />
            </li>
          ))}
        </ul>
        <div className={styles.par}>
          <span className={styles.statLabel}>Par</span>
          <span className={styles.statValue}>
            {level.par}
            <span className={styles.parStars} aria-label={`currently on track for ${projectedStars} stars`}>
              {'★'.repeat(projectedStars)}
            </span>
          </span>
        </div>
      </section>

      <div className={styles.boardArea}>
        <Board
          level={level}
          orients={puzzle.orients}
          turns={puzzle.turns}
          trace={trace}
          onActivate={onActivate}
          highlightTile={puzzle.hintTile}
          ghostSegments={puzzle.ghostSegments}
          isLocked={trace.isSolved || Boolean(result)}
          label={`${heading} board. Use arrow keys to move, Enter to rotate.`}
        />
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" icon="restart" label="Restart level" onClick={restart} />
        <HelperBar
          helperIds={offeredHelpers}
          inventory={progress.helpers}
          usedCount={puzzle.usedHelpers.length}
          allowed={helpersAllowed}
          disabled={trace.isSolved || Boolean(result)}
          onUse={requestHelper}
        />
      </div>

      <p className={styles.message} role="status" aria-live="polite">
        {message}
      </p>

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
      {showConfetti && <Confetti key={level.id + moves} />}
      {result && (
        <WinDialog
          result={result}
          par={level.par}
          difficulty={level.difficulty}
          hasNext={Boolean(nextLevel)}
          onNext={() => nextLevel && navigate(nextLevel)}
          onReplay={restart}
          onMap={() => navigate(backHref)}
        />
      )}
    </main>
  );
}
