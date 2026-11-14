import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import Icon from '../../components/Icon.jsx';
import PartnerSwitcher from './PartnerSwitcher.jsx';
import PalCollection from './PalCollection.jsx';
import styles from './PalsScreen.module.css';

/** Everything about your Pals in one place: your partner, the team, the wardrobe, and (soon) their home. */
export default function PalsScreen() {
  return (
    <div className={styles.page}>
      <ScreenHeader title="My Pals" />
      <main className={styles.main}>
        <PartnerSwitcher />
        <PalCollection />
        <section className={styles.home} aria-labelledby="pal-home-title">
          <span className={styles.homeIcon} aria-hidden="true">
            <Icon name="home" size={28} />
          </span>
          <div>
            <h2 id="pal-home-title" className="game-title">
              Pal Home
            </h2>
            <p>Coming soon: a cozy home for your Pals, with furniture to collect.</p>
          </div>
        </section>
      </main>
      <BottomNav active="pals" />
    </div>
  );
}
