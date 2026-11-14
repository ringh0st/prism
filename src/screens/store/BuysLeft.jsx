import Icon from '../../components/Icon.jsx';
import { DAILY_SPARK_PURCHASE_LIMIT } from '../../game/catalog.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './Stall.module.css';

/** Today's helper buys with sparks as little bags: full bags are left, dashed rings are used. */
export default function BuysLeft({ left }) {
  const { t } = useI18n();
  return (
    <p className={styles.buysLeft}>
      <span className={styles.buysLabel} aria-hidden="true">
        {t('shop.helpers.today')}
      </span>
      {Array.from({ length: DAILY_SPARK_PURCHASE_LIMIT }, (_, i) => (
        <span key={i} className={i < left ? styles.bagLeft : styles.bagUsed} aria-hidden="true">
          {i < left && <Icon name="bag" size={16} />}
        </span>
      ))}
      <span className="visually-hidden">{t('shop.helpers.buysLeft', { count: left })}</span>
    </p>
  );
}
