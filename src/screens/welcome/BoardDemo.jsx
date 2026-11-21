import { useEffect, useMemo, useRef, useState } from 'react';
import Board from '../../components/board/Board.jsx';
import { traceBeams } from '../../game/beam.js';
import styles from './WelcomeTour.module.css';

const STEP_MS = 1500;

/**
 * A tiny real board that plays itself: it steps through `frames` (the turns of each tile), with a
 * pointing hand on the mirror about to turn, so the welcome tour shows the game instead of telling it.
 */
export default function BoardDemo({ level, frames }) {
  const [frame, setFrame] = useState(0);
  const boardRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setFrame((current) => (current + 1) % frames.length), STEP_MS);
    return () => clearInterval(timer);
  }, [frames.length]);

  // Look only: nothing in the demo can be focused or tapped.
  useEffect(() => {
    boardRef.current?.setAttribute('inert', '');
  }, []);

  const turns = frames[frame];
  const orients = useMemo(() => turns.map((count) => count % 2), [turns]);
  const trace = useMemo(() => traceBeams(level, orients), [level, orients]);
  const next = frames[(frame + 1) % frames.length];
  const tileToTurn = next.findIndex((count, i) => count !== turns[i]);

  return (
    <div className={styles.demoBoard} ref={boardRef} aria-hidden="true">
      <Board
        level={level}
        orients={orients}
        turns={turns}
        trace={trace}
        onActivate={() => {}}
        isLocked
        scene="library"
        coach={tileToTurn >= 0 && !trace.isSolved ? { tile: tileToTurn, labels: false } : null}
      />
    </div>
  );
}
