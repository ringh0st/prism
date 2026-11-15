import Icon from '../Icon.jsx';
import { sfx } from '../../audio/sfx.js';
import styles from './BottomNav.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';

// The map (the game itself) sits in the middle as the big raised button; the rest are around it.
const TABS = [
  { route: 'pals', href: '#/pals', icon: 'paw', label: 'nav.pals' },
  { route: 'top', href: '#/top', icon: 'trophy', label: 'nav.top' },
  { route: 'map', href: '#/', icon: 'map', label: 'nav.map', isMain: true },
  { route: 'store', href: '#/store', icon: 'bag', label: 'nav.shop' },
  { route: 'settings', href: '#/settings', icon: 'user', label: 'nav.me' },
];

/**
 * Big chunky game tab bar along the bottom of the screen. The map is the main game, so its tab sits in the middle
 * as a slightly bigger green tile, always in the main color, easy to find from anywhere without shouting. (The daily
 * puzzle lives on the map's top bar.)
 */
export default function BottomNav({ active }) {
  const { t } = useI18n();
  return (
    <nav className={styles.nav} aria-label={t('nav.main')}>
      {TABS.map((tab) => (
        <a
          key={tab.route}
          href={tab.href}
          className={`${styles.tab} ${tab.isMain ? styles.main : ''} ${active === tab.route ? styles.active : ''}`}
          aria-current={active === tab.route ? 'page' : undefined}
          onClick={() => active !== tab.route && sfx.tab()}
        >
          <span className={styles.icon}>
            <Icon name={tab.icon} size={tab.isMain ? 27 : 24} strokeWidth={2.6} />
          </span>
          <span className={styles.label}>{t(tab.label)}</span>
        </a>
      ))}
    </nav>
  );
}
