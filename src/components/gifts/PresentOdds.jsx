import Icon from '../Icon.jsx';
import { PRESENT_BASE_SPARKS, PRESENT_ODDS } from '../../game/gifts.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './PresentOdds.module.css';

const ICONS = { helper: 'hint', sparks: 'spark', item: 'shirt' };

/** What a present can hold, with the odds (shown before opening: no hidden chances). */
export default function PresentOdds() {
  const { t } = useI18n();
  return (
    <section className={styles.odds} aria-labelledby="present-odds">
      <h3 id="present-odds" className={styles.title}>
        {t('present.odds.title')}
      </h3>
      <p className={styles.always}>{t('present.odds.always', { n: PRESENT_BASE_SPARKS })}</p>
      <ul className={styles.list}>
        {PRESENT_ODDS.map((odd) => (
          <li key={odd.kind} className={styles.row}>
            <Icon name={ICONS[odd.kind]} size={18} />
            <span className={styles.what}>{t(`present.odds.${odd.kind}`, { n: odd.sparks ?? 0 })}</span>
            <span className={`game-title ${styles.chance}`}>{odd.chance}%</span>
          </li>
        ))}
      </ul>
      <p className={styles.note}>{t('present.odds.note')}</p>
    </section>
  );
}
