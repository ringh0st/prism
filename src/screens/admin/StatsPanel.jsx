import { useEffect, useState } from 'react';
import { fetchLevelStats, fetchPlayCounts } from '../../lib/adminApi.js';
import { useLevels } from '../../state/LevelsContext.jsx';
import { WALL_MIN_STARTS, WALL_WIN_RATE, findWalls, winRateOf } from '../../game/playCounts.js';
import DifficultyBadge from '../../components/DifficultyBadge.jsx';
import WallList from './WallList.jsx';
import styles from './Admin.module.css';

const DAYS = 30;
const percent = (share) => (share === null ? '–' : `${Math.round(share * 100)}%`);

/** Where players get stuck (anonymous play counts, guests included) and how signed-in players finish levels. */
export default function StatsPanel() {
  const { worlds, levelRefsInWorld } = useLevels();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchLevelStats(), fetchPlayCounts(DAYS)])
      .then(([progress, plays]) => setStats({ ...progress, plays }))
      .catch(() => setError('Could not load stats. Has supabase/play_stats.sql been run?'));
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!stats) return <p>Loading stats…</p>;

  // Only worlds that someone has reached, so the table stays readable with 1000 levels.
  const isReached = (id) => stats.byLevel.has(id) || stats.plays.has(id);
  const reachedWorlds = worlds.filter((world) => levelRefsInWorld(world.id).some((ref) => isReached(ref.id)));
  const levels = reachedWorlds.flatMap((world) => levelRefsInWorld(world.id));
  const walls = findWalls(stats.plays);
  const totalStarts = [...stats.plays.values()].reduce((sum, counts) => sum + counts.starts, 0);
  return (
    <div className={styles.stats}>
      <p className={styles.statsSummary}>
        Last {DAYS} days: <strong>{totalStarts}</strong> level attempts by everyone (guests too, no personal data).{' '}
        <strong>{stats.playerCount}</strong> signed-in players have saved progress.
      </p>
      <WallList walls={walls} />
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="visually-hidden">Play and completion statistics per level</caption>
          <thead>
            <tr>
              <th scope="col">Level</th>
              <th scope="col">Tries</th>
              <th scope="col">Win rate</th>
              <th scope="col">Out of moves</th>
              <th scope="col">Gave up</th>
              <th scope="col">Avg ★</th>
              <th scope="col">3★</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level) => {
              const entry = stats.byLevel.get(level.id);
              const plays = stats.plays.get(level.id);
              const winRate = winRateOf(plays);
              const isWall = plays?.starts >= WALL_MIN_STARTS && winRate < WALL_WIN_RATE;
              return (
                <tr key={level.id} className={isWall ? styles.warnRow : ''}>
                  <th scope="row">
                    {level.world}-{level.index} <DifficultyBadge difficulty={level.difficulty} compact />
                  </th>
                  <td>{plays?.starts ?? 0}</td>
                  <td>{percent(winRate)}</td>
                  <td>{plays?.outOfMoves ?? 0}</td>
                  <td>{plays?.quits ?? 0}</td>
                  <td>{entry ? (entry.starTotal / entry.completions).toFixed(1) : '–'}</td>
                  <td>{entry ? percent(entry.perfect / entry.completions) : '–'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={styles.hint}>
        Highlighted rows are walls: at least {WALL_MIN_STARTS} tries and under {percent(WALL_WIN_RATE)} won. Hard and Extra Hard levels are meant to
        be tougher, so a wall on a normal level matters most. “Gave up” counts leaving mid-level or using Skip.
      </p>
    </div>
  );
}
