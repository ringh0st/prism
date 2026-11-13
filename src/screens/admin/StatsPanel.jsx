import { useEffect, useState } from 'react';
import { fetchLevelStats } from '../../lib/adminApi.js';
import { useLevels } from '../../state/LevelsContext.jsx';
import DifficultyBadge from '../../components/DifficultyBadge.jsx';
import styles from './Admin.module.css';

/** Which levels players finish, and where they drop off. */
export default function StatsPanel() {
  const { levels } = useLevels();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLevelStats()
      .then(setStats)
      .catch(() => setError('Could not load stats.'));
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!stats) return <p>Loading stats…</p>;

  let previousCompletions = null;
  return (
    <div className={styles.stats}>
      <p className={styles.statsSummary}>
        <strong>{stats.playerCount}</strong> signed-in players have saved progress. Guests aren’t counted.
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="visually-hidden">Completion statistics per level</caption>
          <thead>
            <tr>
              <th scope="col">Level</th>
              <th scope="col">Par</th>
              <th scope="col">Completed</th>
              <th scope="col">Avg ★</th>
              <th scope="col">3★</th>
              <th scope="col">Drop-off</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level) => {
              const entry = stats.byLevel.get(level.id);
              const completions = entry?.completions ?? 0;
              const dropOff =
                previousCompletions && previousCompletions > 0 ? Math.round((1 - completions / previousCompletions) * 100) : null;
              previousCompletions = completions;
              return (
                <tr key={level.id} className={dropOff !== null && dropOff >= 40 ? styles.warnRow : ''}>
                  <th scope="row">
                    {level.world}-{level.index} <DifficultyBadge difficulty={level.difficulty} compact />
                  </th>
                  <td>{level.par}</td>
                  <td>{completions}</td>
                  <td>{entry ? (entry.starTotal / completions).toFixed(1) : '–'}</td>
                  <td>{entry ? `${Math.round((entry.perfect / completions) * 100)}%` : '–'}</td>
                  <td>{dropOff === null ? '–' : `${dropOff}%`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={styles.hint}>Rows with a 40%+ drop-off are highlighted: those levels may be too hard for their position.</p>
    </div>
  );
}
