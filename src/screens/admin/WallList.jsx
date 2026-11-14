import { WALL_MIN_STARTS } from '../../game/playCounts.js';
import styles from './Admin.module.css';

/** The levels players struggle with most, hardest first, each linked to its page in the game. */
export default function WallList({ walls }) {
  return (
    <section className={styles.walls} aria-labelledby="walls-title">
      <h3 id="walls-title">Walls: where players get stuck</h3>
      {walls.length === 0 ? (
        <p className={styles.hint}>No walls yet. A level shows up here once it has {WALL_MIN_STARTS}+ tries and fewer than half are won.</p>
      ) : (
        <ol className={styles.wallList}>
          {walls.slice(0, 10).map((wall) => (
            <li key={wall.levelId}>
              <a href={`#/play/${wall.levelId}`}>{wall.levelId.replace(/^w/, '').replace('-0', '-')}</a>
              <span>
                {Math.round(wall.winRate * 100)}% won of {wall.starts} tries · {wall.outOfMoves} out of moves · {wall.quits} gave up
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
