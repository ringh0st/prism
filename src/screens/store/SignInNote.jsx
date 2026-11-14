import Icon from '../../components/Icon.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './Stall.module.css';

/** A small pinned note: diamonds need an account, with the way to sign in. */
export default function SignInNote() {
  const { t } = useI18n();
  return (
    <p className={styles.signInNote}>
      <Icon name="diamond" size={18} />
      <span>{t('shop.signInNote.text')}</span>
      <a href="#/settings" className={styles.signInLink}>
        <Icon name="user" size={16} />
        {t('shop.signInNote.link')}
      </a>
    </p>
  );
}
