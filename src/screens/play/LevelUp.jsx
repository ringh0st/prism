import { useEffect } from 'react';
import { sfx } from '../../audio/sfx.js';
import styles from './LevelUp.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';

/** The win screen's "Rank up!" ribbon: the new player rank (from stars), and the new title when one was earned. */
export default function LevelUp({ level, title }) {
  const { t } = useI18n();
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
        <strong className="game-title">{t(title ? 'rank.newTitle' : 'rank.up')}</strong>
        <span>
          {title ? t('rank.nowTitle', { title: t(`title.${title.tone}`, {}, title.name) }) : t('rank.reached', { n: level })}
          {title && level ? ` · ${t('rank.label', { n: level })}` : ''}
        </span>
      </span>
    </a>
  );
}
