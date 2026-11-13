import Button from '../Button.jsx';
import Ribbon from './Ribbon.jsx';
import CurrencyHud from './CurrencyHud.jsx';
import styles from './ScreenHeader.module.css';

/** Back button, ribbon title and currency counters, for secondary screens. */
export default function ScreenHeader({ title, backHref = '#/', showCurrencies = true }) {
  return (
    <header className={styles.header}>
      <Button as="a" href={backHref} variant="secondary" icon="back" label="Back" />
      <Ribbon as="h1" size="sm">
        {title}
      </Ribbon>
      {showCurrencies ? <CurrencyHud showStars={false} /> : <span />}
    </header>
  );
}
