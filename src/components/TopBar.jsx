import Button from './Button.jsx';
import StatChip from './StatChip.jsx';
import { usePlayer } from '../state/PlayerContext.jsx';
import { totalStars } from '../game/progress.js';
import logoUrl from '../assets/logo.png';
import styles from './TopBar.module.css';

/** App header: brand, star and spark counters, settings. */
export default function TopBar() {
  const { progress } = usePlayer();
  return (
    <header className={styles.bar}>
      <a href="#/" className={styles.brand}>
        <img src={logoUrl} alt="" width="36" height="36" />
        <span>Prism</span>
      </a>
      <div className={styles.stats}>
        <StatChip icon="star" value={totalStars(progress)} label="stars" />
        <StatChip icon="spark" value={progress.sparks} label="sparks" tone="tangerine" />
        <Button as="a" href="#/settings" variant="secondary" icon="settings" label="Settings" />
      </div>
    </header>
  );
}
