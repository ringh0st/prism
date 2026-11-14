import { useEffect } from 'react';
import { sfx } from '../../audio/sfx.js';
import styles from './LevelUp.module.css';

/** The win screen's "Rank up!" ribbon: the new player rank (from stars), and the new title when one was earned. */
export default function LevelUp({ level, title }) {
  useEffect(() => {
    const timer = setTimeout(() => sfx.levelUp(), 600);
    return () => clearTimeout(timer);
  }, []);
  return (
    <a href="#/settings" className={styles.levelUp} role="status">
      <span className={`game-title ${styles.badge}`} aria-hidden="true">
        {level ?? '★'}
      </span>
      <span className={styles.text}>
        <strong className="game-title">{title ? 'New title!' : 'Rank up!'}</strong>
        <span>
          {title ? `You are now a ${title.name}` : `You reached rank ${level}`}
          {title && level ? ` · Rank ${level}` : ''}
        </span>
      </span>
    </a>
  );
}
