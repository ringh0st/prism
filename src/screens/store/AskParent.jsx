import Icon from '../../components/Icon.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './Stall.module.css';

/** The short "ask a parent" note shown wherever diamonds (which can cost real money) are spent. */
export default function AskParent() {
  const { t } = useI18n();
  return (
    <p className={styles.legal}>
      <Icon name="shield" size={16} />
      <span>{t('shop.askParent')}</span>
    </p>
  );
}
