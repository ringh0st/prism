import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import PartnerSwitcher from './PartnerSwitcher.jsx';
import PalCollection from './PalCollection.jsx';
import GroveHome from '../grove/GroveHome.jsx';
import LuckyPalProgress from './LuckyPalProgress.jsx';
import styles from './PalsScreen.module.css';

/** Everything about your Pals in one place: your partner, their home in the Grove, the team and the wardrobe. */
export default function PalsScreen() {
  return (
    <div className={styles.page}>
      <ScreenHeader title="My Pals" />
      <main className={styles.main}>
        <PartnerSwitcher />
        <GroveHome />
        <LuckyPalProgress />
        <PalCollection />
      </main>
      <BottomNav active="pals" />
    </div>
  );
}
