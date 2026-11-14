import Button from '../Button.jsx';
import ScreenTitle from './ScreenTitle.jsx';
import CurrencyHud from './CurrencyHud.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './ScreenHeader.module.css';

/** Back button, ribbon title and currency counters, for secondary screens. */
export default function ScreenHeader({ title, backHref = '#/', showCurrencies = true }) {
  const { t } = useI18n();
  return (
    <header className={styles.header}>
      <Button as="a" href={backHref} variant="secondary" icon="back" label={t('ui.back')} />
      <ScreenTitle as="h1" size="sm">
        {title}
      </ScreenTitle>
      {showCurrencies ? <CurrencyHud showStars={false} /> : <span />}
    </header>
  );
}
