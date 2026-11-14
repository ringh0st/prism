import GlowbugArt from '../../components/glowbugs/GlowbugArt.jsx';
import { glowbugById } from '../../game/glowbugs.js';
import styles from './GlowbugRescue.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';

/** On the win screen: the level's Glowbug, rescued (three stars) or still shy. */
export default function GlowbugRescue({ glowbug }) {
  const { t, lang } = useI18n();
  const bug = glowbugById(glowbug.id);
  if (!glowbug.isRescued) {
    return (
      <p className={`${styles.rescue} ${styles.shy}`}>
        <GlowbugArt id={bug.id} size={48} isAwake={false} />
        <span>{t('glowbug.shy', { name: bug.name })}</span>
      </p>
    );
  }
  return (
    <div className={styles.rescue} role="status">
      <span className={styles.art}>
        <GlowbugArt id={bug.id} size={64} />
      </span>
      <span>
        {glowbug.isNew && <span className={styles.new}>{t('common.new')}</span>}
        <strong>{t('glowbug.rescued', { name: bug.name })}</strong>
        {lang === 'en' && (
          <>
            {' '}
            <span className={styles.kind}>({bug.title})</span>
            <span className={styles.bio}>{bug.bio}</span>
          </>
        )}
        <a href="#/glowbugs" className={styles.link}>
          {t('glowbug.visit')}
        </a>
      </span>
    </div>
  );
}
