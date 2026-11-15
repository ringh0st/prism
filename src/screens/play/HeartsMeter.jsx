import Icon from '../../components/Icon.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './HeartsMeter.module.css';

/** The try's hearts: full ones, and broken ones that crack and fade when a wrong turn costs one. */
export default function HeartsMeter({ total, left }) {
  const { t } = useI18n();
  return (
    <ul className={styles.hearts} aria-label={t('play.heartsLeft', { count: left, total })} data-tour="hearts">
      {Array.from({ length: total }, (_, i) => (
        <li key={i} className={i < left ? styles.full : styles.broken} aria-hidden="true">
          <Icon name="heart" size={17} />
        </li>
      ))}
    </ul>
  );
}
