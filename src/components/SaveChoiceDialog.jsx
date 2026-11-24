import Dialog from './Dialog.jsx';
import Button from './Button.jsx';
import Icon from './Icon.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import styles from './SaveChoiceDialog.module.css';

/**
 * At sign-in, when the account already has a game and this phone holds things it doesn't: the two games side by
 * side (levels, stars, Pals, sparks), and the player picks. Keeping both is the default (closing does that too):
 * nothing is lost, the higher of every count is kept and Pals, outfits and decor are joined.
 */
export default function SaveChoiceDialog({ choice, onChoose }) {
  const { t } = useI18n();
  const card = (key, summary, icon) => (
    <div className={styles.card}>
      <span className={styles.head}>
        <Icon name={icon} size={18} />
        {t(`saveChoice.${key}`)}
      </span>
      <ul className={styles.facts}>
        <li aria-label={t('saveChoice.levels', { count: summary.levels })}>
          <Icon name="map" size={16} />
          <b>{summary.levels}</b>
        </li>
        <li aria-label={t('saveChoice.stars', { count: summary.stars })}>
          <Icon name="star" size={16} />
          <b>{summary.stars}</b>
        </li>
        <li aria-label={t('saveChoice.pals', { count: summary.pals })}>
          <Icon name="paw" size={16} />
          <b>{summary.pals}</b>
        </li>
        <li aria-label={t('saveChoice.sparks', { count: summary.sparks })}>
          <Icon name="spark" size={16} />
          <b>{summary.sparks}</b>
        </li>
      </ul>
    </div>
  );
  return (
    <Dialog title={t('saveChoice.title')} onClose={() => onChoose('combine')}>
      <p className={styles.lead}>{t('saveChoice.lead')}</p>
      <div className={styles.cards}>
        {card('phone', choice.phone, 'phone')}
        {card('account', choice.account, 'user')}
      </div>
      <Button size="lg" onClick={() => onChoose('combine')} data-autofocus>
        {t('saveChoice.both')}
      </Button>
      <p className={styles.note}>{t('saveChoice.bothNote')}</p>
      <Button variant="secondary" onClick={() => onChoose('account')}>
        {t('saveChoice.accountOnly')}
      </Button>
    </Dialog>
  );
}
