import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import BuyButtons from '../components/BuyButtons.jsx';
import { usePlayer } from '../state/PlayerContext.jsx';
import { DIAMOND_PACKS, DIAMOND_REWARDS, HELPERS, INVENTORY_CAP, STORE_ITEMS } from '../game/catalog.js';
import { sparkPurchasesLeft } from '../game/progress.js';
import { todayKey } from '../game/daily.js';
import { startDiamondCheckout } from '../lib/economyApi.js';
import { PAYMENTS_ENABLED, TERMS_URL } from '../lib/config.js';
import { sfx } from '../audio/sfx.js';
import styles from './StoreScreen.module.css';

const TABS = [
  { id: 'helpers', label: 'Helpers', icon: 'hint' },
  { id: 'sparks', label: 'Sparks', icon: 'spark' },
  { id: 'diamonds', label: 'Diamonds', icon: 'diamond' },
];

function HelpersTab({ onBuy, busyItem }) {
  const { progress, isSignedIn } = usePlayer();
  const left = sparkPurchasesLeft(progress, todayKey());
  return (
    <>
      <p className={styles.intro}>
        Stuck? Helpers get you moving. You can hold up to {INVENTORY_CAP} of each, and buy {left === 1 ? '1 more' : `${left} more`} with sparks
        today.
      </p>
      <ul className={styles.grid}>
        {STORE_ITEMS.filter((item) => item.kind === 'helper').map((item) => {
          const helper = HELPERS[item.grants.helper];
          const owned = progress.helpers[helper.id] ?? 0;
          return (
            <li key={item.id} className={styles.card}>
              <div className={styles.cardIcon} aria-hidden="true">
                <Icon name={helper.icon} size={28} />
              </div>
              <h3>{helper.name}</h3>
              <p className={styles.cardText}>{helper.description}</p>
              <p className={styles.owned}>
                You have {owned}/{INVENTORY_CAP} · max {helper.starCap} ★ when used
              </p>
              <BuyButtons item={item} itemName={helper.name} progress={progress} isSignedIn={isSignedIn} isBusy={busyItem === item.id} onBuy={(currency) => onBuy(item.id, currency)} />
            </li>
          );
        })}
      </ul>
    </>
  );
}

function SparksTab({ onBuy, busyItem }) {
  const { progress, isSignedIn } = usePlayer();
  return (
    <>
      <p className={styles.intro}>Trade diamonds for sparks. You also earn sparks with every new star and daily puzzle.</p>
      <ul className={styles.grid}>
        {STORE_ITEMS.filter((item) => item.kind === 'sparks').map((item) => (
          <li key={item.id} className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.sparkIcon}`} aria-hidden="true">
              <Icon name="spark" size={28} />
            </div>
            <h3>{item.grants.sparks} sparks</h3>
            <BuyButtons item={item} itemName={`${item.grants.sparks} sparks`} progress={progress} isSignedIn={isSignedIn} isBusy={busyItem === item.id} onBuy={(currency) => onBuy(item.id, currency)} />
          </li>
        ))}
      </ul>
      {!isSignedIn && <SignInNote />}
    </>
  );
}

function SignInNote() {
  return (
    <p className={styles.signIn}>
      <Icon name="user" size={18} /> Diamonds are saved to your account. <a href="#/settings">Sign in with Google</a> to earn and use them.
    </p>
  );
}

function DiamondsTab({ onError }) {
  const { isSignedIn } = usePlayer();
  const [busyPack, setBusyPack] = useState(null);

  const buyPack = async (packId) => {
    setBusyPack(packId);
    try {
      window.location.assign(await startDiamondCheckout(packId));
    } catch (error) {
      onError(error.message);
      setBusyPack(null);
    }
  };

  return (
    <>
      <section className={styles.free} aria-labelledby="free-diamonds">
        <h3 id="free-diamonds">Earn diamonds for free</h3>
        <ul>
          <li>
            <Icon name="check" size={18} /> Finish a world: +{DIAMOND_REWARDS.worldComplete}
          </li>
          <li>
            <Icon name="star" size={18} /> Get 3 stars on every level of a world: +{DIAMOND_REWARDS.worldPerfect}
          </li>
          <li>
            <Icon name="flame" size={18} /> Every 7 days of daily-puzzle streak: +{DIAMOND_REWARDS.streakWeek}
          </li>
        </ul>
      </section>

      {!isSignedIn && <SignInNote />}

      <ul className={styles.grid}>
        {DIAMOND_PACKS.map((pack) => (
          <li key={pack.id} className={`${styles.card} ${pack.tag ? styles.featured : ''}`}>
            {pack.tag && <span className={styles.tag}>{pack.tag}</span>}
            <div className={`${styles.cardIcon} ${styles.diamondIcon}`} aria-hidden="true">
              <Icon name="diamond" size={28} />
            </div>
            <h3>{pack.diamonds + pack.bonus} diamonds</h3>
            {pack.bonus > 0 && <p className={styles.bonus}>includes {pack.bonus} bonus</p>}
            <Button
              size="sm"
              disabled={!PAYMENTS_ENABLED || !isSignedIn || busyPack !== null}
              onClick={() => buyPack(pack.id)}
              aria-label={`Buy ${pack.diamonds + pack.bonus} diamonds for ${pack.displayPrice}`}
            >
              {PAYMENTS_ENABLED ? (busyPack === pack.id ? 'Opening…' : pack.displayPrice) : 'Coming soon'}
            </Button>
          </li>
        ))}
      </ul>

      <p className={styles.legal}>
        <strong>Under 18? Ask a parent or guardian before buying.</strong> Diamonds are a one-time purchase for this game, with no
        subscriptions or random rewards. Payments are processed securely by our payment partner. See our <a href={TERMS_URL}>Terms & refunds</a>.
      </p>
    </>
  );
}

export default function StoreScreen({ isReturningFromCheckout = false }) {
  const { buyItem, refresh } = usePlayer();
  const [tab, setTab] = useState(isReturningFromCheckout ? 'diamonds' : 'helpers');
  const [busyItem, setBusyItem] = useState(null);
  const [message, setMessage] = useState(
    isReturningFromCheckout ? 'Thank you! Your diamonds will appear in a few seconds.' : '',
  );

  // After checkout the payment webhook adds the diamonds; check back a couple of times.
  useEffect(() => {
    if (!isReturningFromCheckout) return undefined;
    const timers = [3000, 8000, 15000].map((ms) => setTimeout(refresh, ms));
    return () => timers.forEach(clearTimeout);
  }, [isReturningFromCheckout, refresh]);

  const buy = async (itemId, currency) => {
    setBusyItem(itemId);
    setMessage('');
    try {
      await buyItem(itemId, currency);
      sfx.sparkle();
      setMessage('Added to your collection!');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyItem(null);
    }
  };

  return (
    <div className={styles.page}>
      <TopBar />
      <main className={styles.main}>
        <div className={styles.titleRow}>
          <Button as="a" href="#/" variant="secondary" icon="back" label="Back to map" />
          <h1>Store</h1>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Store sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`store-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="store-panel"
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={18} /> {t.label}
            </button>
          ))}
        </div>

        <p className={styles.message} role="status" aria-live="polite">
          {message}
        </p>

        <section id="store-panel" role="tabpanel" aria-labelledby={`store-tab-${tab}`} className={styles.panel}>
          {tab === 'helpers' && <HelpersTab onBuy={buy} busyItem={busyItem} />}
          {tab === 'sparks' && <SparksTab onBuy={buy} busyItem={busyItem} />}
          {tab === 'diamonds' && <DiamondsTab onError={setMessage} />}
        </section>
      </main>
    </div>
  );
}
