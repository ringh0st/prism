import Button from './Button.jsx';
import WalletLink from './WalletLink.jsx';
import logoUrl from '../assets/logo.png';
import styles from './TopBar.module.css';

/** App header: brand, wallet (opens the store) and settings. */
export default function TopBar() {
  return (
    <header className={styles.bar}>
      <a href="#/" className={styles.brand} aria-label="Prism home">
        <img src={logoUrl} alt="" width="36" height="36" />
        <span className={styles.brandName}>Prism</span>
      </a>
      <div className={styles.stats}>
        <WalletLink />
        <Button as="a" href="#/settings" variant="secondary" icon="settings" label="Settings" />
      </div>
    </header>
  );
}
