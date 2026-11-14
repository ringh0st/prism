import Icon from '../Icon.jsx';
import { sfx } from '../../audio/sfx.js';
import styles from './BottomNav.module.css';

const TABS = [
  { route: 'map', href: '#/', icon: 'map', label: 'Map' },
  { route: 'pals', href: '#/pals', icon: 'paw', label: 'Pals' },
  { route: 'top', href: '#/top', icon: 'trophy', label: 'Top' },
  { route: 'store', href: '#/store', icon: 'bag', label: 'Shop' },
  { route: 'settings', href: '#/settings', icon: 'user', label: 'Me' },
];

/** Big chunky game tab bar along the bottom of the screen. (The daily puzzle lives on the map's top bar.) */
export default function BottomNav({ active }) {
  return (
    <nav className={styles.nav} aria-label="Main">
      {TABS.map((tab) => (
        <a
          key={tab.route}
          href={tab.href}
          className={`${styles.tab} ${active === tab.route ? styles.active : ''}`}
          aria-current={active === tab.route ? 'page' : undefined}
          onClick={() => active !== tab.route && sfx.tab()}
        >
          <span className={styles.icon}>
            <Icon name={tab.icon} size={24} strokeWidth={2.6} />
          </span>
          <span className={styles.label}>{tab.label}</span>
        </a>
      ))}
    </nav>
  );
}
