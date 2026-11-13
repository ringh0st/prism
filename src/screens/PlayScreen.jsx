import { useCallback, useEffect, useRef, useState } from 'react';
import Board from '../components/board/Board.jsx';
import Button from '../components/Button.jsx';
import StatChip from '../components/StatChip.jsx';
import DifficultyBadge from '../components/DifficultyBadge.jsx';
import Confetti from '../components/Confetti.jsx';
import GemShape from '../components/GemShape.jsx';
import WinDialog from './WinDialog.jsx';
import { usePuzzle } from '../hooks/usePuzzle.js';
import { usePlayer } from '../state/PlayerContext.jsx';
import { navigate } from '../hooks/useHashRoute.js';
import { sfx } from '../audio/sfx.js';
import { HINT_COST, starsForMoves } from '../game/scoring.js';
import { TILE } from '../game/constants.js';
import styles from './PlayScreen.module.css';

const WIN_DIALOG_DELAY_MS = 900;

/**
 * mode: 'level' (records progress) | 'daily' (streak + sparks) | 'playtest' (admin preview, records nothing)
 */
export default function PlayScreen({ level, mode = 'level', title, backHref = '#/', nextLevel = null, dateKey }) {
  const { progress, finishLevel, finishDaily, trySpendSparks } = usePlayer();
  const puzzle = usePuzzle(level);
  const { trace, moves } = puzzle;
  const [result, setResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [message, setMessage] = useState('');
  const lastLitCount = useRef(0);
  const lastShadeCount = useRef(0);
  const hasRecordedWin = useRef(false);

  const gems = level.tiles.map((tile, i) => ({ tile, i })).filter(({ tile }) => tile.type === TILE.GEM);

  // Reset per level.
  useEffect(() => {
    setResult(null);
    setShowConfetti(false);
    setMessage('');
    hasRecordedWin.current = false;
  }, [level.id]);

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

  // Win.
  useEffect(() => {
    if (!trace.isSolved || hasRecordedWin.current) return undefined;
    hasRecordedWin.current = true;
    sfx.win();
    setShowConfetti(true);
    setMessage('Solved!');

    let outcome;
    if (mode === 'level') {
      outcome = finishLevel(level, { moves, usedHint: puzzle.usedHint });
    } else {
      const stars = starsForMoves(moves, level.par, { usedHint: puzzle.usedHint });
      const daily = mode === 'daily' ? finishDaily(dateKey) : { sparksEarned: 0, streak: 0 };
      outcome = { stars, sparksEarned: daily.sparksEarned, streak: daily.streak, isNewBest: false };
    }
    const timer = setTimeout(() => setResult({ ...outcome, moves }), WIN_DIALOG_DELAY_MS);
    return () => clearTimeout(timer);
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

  const askForHint = useCallback(() => {
    if (trace.isSolved) return;
    if (mode !== 'playtest' && !trySpendSparks(HINT_COST)) {
      setMessage(`You need ${HINT_COST} sparks for a hint. Earn sparks by collecting stars.`);
      return;
    }
    const tileIndex = puzzle.revealHint();
    if (tileIndex !== null) {
      sfx.sparkle();
      setMessage('Hint: rotate the glowing piece.');
    }
  }, [trace.isSolved, mode, trySpendSparks, puzzle]);

  // Keyboard shortcuts: R restart, H hint.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target.closest?.('[role="dialog"]') || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'r' || event.key === 'R') restart();
      if (event.key === 'h' || event.key === 'H') askForHint();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [restart, askForHint]);

  const projectedStars = starsForMoves(Math.max(moves, level.par), level.par, { usedHint: puzzle.usedHint });
  const heading = title || level.name || `Level ${level.world}-${level.index}`;

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <Button as="a" href={backHref} variant="secondary" icon="back" label="Back to map" />
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{heading}</h1>
          <DifficultyBadge difficulty={level.difficulty} />
        </div>
        <StatChip icon="spark" value={progress.sparks} label="sparks" tone="tangerine" />
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
          isLocked={trace.isSolved}
          label={`${heading} board. Use arrow keys to move, Enter to rotate.`}
        />
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" icon="restart" onClick={restart}>
          Restart
        </Button>
        <Button variant="secondary" icon="hint" onClick={askForHint} disabled={trace.isSolved}>
          Hint <span className={styles.cost}>{mode === 'playtest' ? 'free' : `${HINT_COST}✦`}</span>
        </Button>
      </div>

      <p className={styles.message} role="status" aria-live="polite">
        {message}
      </p>

      {showConfetti && <Confetti key={level.id + moves} />}
      {result && (
        <WinDialog
          result={result}
          par={level.par}
          difficulty={level.difficulty}
          streak={result.streak ?? 0}
          hasNext={Boolean(nextLevel)}
          onNext={() => nextLevel && navigate(nextLevel)}
          onReplay={restart}
          onMap={() => navigate(backHref)}
        />
      )}
    </main>
  );
}
