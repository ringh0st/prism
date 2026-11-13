import Icon from '../Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { currentStreak } from '../../game/progress.js';
import { todayKey } from '../../game/daily.js';
import styles from './BottomNav.module.css';

const TABS = [
  { route: 'map', href: '#/', icon: 'map', label: 'Map' },
  { route: 'daily', href: '#/daily', icon: 'calendar', label: 'Daily' },
  { route: 'top', href: '#/top', icon: 'trophy', label: 'Top' },
  { route: 'store', href: '#/store', icon: 'bag', label: 'Shop' },
  { route: 'settings', href: '#/settings', icon: 'user', label: 'Me' },
];

/** Big chunky game tab bar along the bottom of the screen. */
export default function BottomNav({ active }) {
  const { progress } = usePlayer();
  const today = todayKey();
  const dailyWaiting = progress.daily.lastDate !== today;
  const streak = currentStreak(progress, today);
  return (
    <nav className={styles.nav} aria-label="Main">
      {TABS.map((tab) => (
        <a key={tab.route} href={tab.href} className={`${styles.tab} ${active === tab.route ? styles.active : ''}`} aria-current={active === tab.route ? 'page' : undefined}>
          <span className={styles.icon}>
            <Icon name={tab.icon} size={24} strokeWidth={2.6} />
            {tab.route === 'daily' && dailyWaiting && <span className={styles.dot} aria-label="New daily puzzle" />}
            {tab.route === 'daily' && streak > 1 && (
              <span className={styles.streak} aria-label={`${streak} day streak`}>
                {streak}
              </span>
            )}
          </span>
          <span className={styles.label}>{tab.label}</span>
        </a>
      ))}
    </nav>
  );
}
