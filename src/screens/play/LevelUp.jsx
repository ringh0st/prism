import { useEffect } from 'react';
import { sfx } from '../../audio/sfx.js';
import styles from './LevelUp.module.css';

/** The win screen's "Level up!" ribbon: the new player level, and the new title when one was earned. */
export default function LevelUp({ level, title }) {
  useEffect(() => {
    const timer = setTimeout(() => sfx.levelUp(), 600);
    return () => clearTimeout(timer);
  }, []);
  return (
    <a href="#/settings" className={styles.levelUp} role="status">
      <span className={`game-title ${styles.badge}`} aria-hidden="true">
        {level ? `Lv ${level}` : '★'}
      </span>
      <span className={styles.text}>
        <strong className="game-title">{title ? 'New title!' : 'Level up!'}</strong>
        <span>
          {title ? `You are now a ${title.name}` : `You reached level ${level}`}
          {title && level ? ` · Lv ${level}` : ''}
        </span>
      </span>
    </a>
  );
}
