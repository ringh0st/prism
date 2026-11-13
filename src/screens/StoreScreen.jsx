import { useEffect, useState } from 'react';
import ScreenHeader from '../components/game/ScreenHeader.jsx';
import BottomNav from '../components/game/BottomNav.jsx';
import Panel from '../components/game/Panel.jsx';
import Lumi from '../components/game/Lumi.jsx';
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

function ShopSlot({ icon, tone, title, badge, tag, children }) {
  return (
    <Panel as="li" className={styles.slot}>
      {tag && <span className={`game-title ${styles.tag}`}>{tag}</span>}
      <div className={`${styles.art} ${styles[tone]}`} aria-hidden="true">
        <span className={styles.burst} />
        <span className={styles.artIcon}>
          <Icon name={icon} size={40} />
        </span>
        {badge && <span className={`game-title ${styles.badge}`}>{badge}</span>}
      </div>
      <h3 className={`game-title ${styles.slotTitle}`}>{title}</h3>
      {children}
    </Panel>
  );
}

function HelpersTab({ onBuy, busyItem }) {
  const { progress, isSignedIn } = usePlayer();
  const left = sparkPurchasesLeft(progress, todayKey());
  return (
    <>
      <p className={styles.intro}>
        Stuck? Helpers get you moving. Hold up to {INVENTORY_CAP} of each. Spark buys left today: <strong>{left}</strong>
      </p>
      <ul className={styles.grid}>
        {STORE_ITEMS.filter((item) => item.kind === 'helper').map((item) => {
          const helper = HELPERS[item.grants.helper];
          const owned = progress.helpers[helper.id] ?? 0;
          return (
            <ShopSlot key={item.id} icon={helper.icon} tone="helper" title={helper.name} badge={`x${owned}`}>
              <p className={styles.slotText}>{helper.description}</p>
              <p className={styles.cap}>
                <Icon name="star" size={13} /> max {helper.starCap} when used
              </p>
              <BuyButtons item={item} itemName={helper.name} progress={progress} isSignedIn={isSignedIn} isBusy={busyItem === item.id} onBuy={(currency) => onBuy(item.id, currency)} />
            </ShopSlot>
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
      <p className={styles.intro}>Trade diamonds for sparks. You also earn sparks from new stars, chests and daily puzzles.</p>
      <ul className={styles.grid}>
        {STORE_ITEMS.filter((item) => item.kind === 'sparks').map((item, i) => (
          <ShopSlot key={item.id} icon="spark" tone={`sparks${i}`} title={`${item.grants.sparks}`} tag={i === 2 ? 'Best value' : null}>
            <p className={styles.slotText}>sparks</p>
            <BuyButtons item={item} itemName={`${item.grants.sparks} sparks`} progress={progress} isSignedIn={isSignedIn} isBusy={busyItem === item.id} onBuy={(currency) => onBuy(item.id, currency)} />
          </ShopSlot>
        ))}
      </ul>
      {!isSignedIn && <SignInNote />}
    </>
  );
}

function SignInNote() {
  return (
    <Panel className={styles.note}>
      <Icon name="user" size={20} />
      <p>
        Diamonds live in your account. <a href="#/settings">Sign in with Google</a> to earn and use them.
      </p>
    </Panel>
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
      <Panel className={styles.free}>
        <h3 className="game-title">Free diamonds!</h3>
        <ul>
          <li>
            <Icon name="check" size={18} /> Finish a world <strong>+{DIAMOND_REWARDS.worldComplete}</strong>
          </li>
          <li>
            <Icon name="star" size={18} /> 3★ a whole world <strong>+{DIAMOND_REWARDS.worldPerfect}</strong>
          </li>
          <li>
            <Icon name="flame" size={18} /> 7-day daily streak <strong>+{DIAMOND_REWARDS.streakWeek}</strong>
          </li>
        </ul>
      </Panel>

      {!isSignedIn && <SignInNote />}

      <ul className={styles.grid}>
        {DIAMOND_PACKS.map((pack, i) => (
          <ShopSlot key={pack.id} icon="diamond" tone={`diamonds${i}`} title={`${pack.diamonds + pack.bonus}`} tag={pack.tag}>
            <p className={styles.slotText}>{pack.bonus > 0 ? `diamonds (+${pack.bonus} bonus)` : 'diamonds'}</p>
            <Button
              size="sm"
              variant="go"
              disabled={!PAYMENTS_ENABLED || !isSignedIn || busyPack !== null}
              onClick={() => buyPack(pack.id)}
              aria-label={`Buy ${pack.diamonds + pack.bonus} diamonds for ${pack.displayPrice}`}
            >
              {PAYMENTS_ENABLED ? (busyPack === pack.id ? 'Opening…' : pack.displayPrice) : 'Coming soon'}
            </Button>
          </ShopSlot>
        ))}
      </ul>

      <p className={styles.legal}>
        <strong>Under 18? Ask a parent or guardian before buying.</strong> One-time purchases, no subscriptions, no random rewards. Payments by our
        partner Lemon Squeezy. <a href={TERMS_URL}>Terms & refunds</a>
      </p>
    </>
  );
}

export default function StoreScreen({ isReturningFromCheckout = false }) {
  const { buyItem, refresh } = usePlayer();
  const [tab, setTab] = useState(isReturningFromCheckout ? 'diamonds' : 'helpers');
  const [busyItem, setBusyItem] = useState(null);
  const [lumi, setLumi] = useState(() =>
    isReturningFromCheckout
      ? { mood: 'dance', line: 'Thank you! Your diamonds are on their way!' }
      : { mood: 'happy', line: 'Welcome to my shop! Everything is shiny.' },
  );

  // After checkout the payment webhook adds the diamonds; check back a couple of times.
  useEffect(() => {
    if (!isReturningFromCheckout) return undefined;
    const timers = [3000, 8000, 15000].map((ms) => setTimeout(refresh, ms));
    return () => timers.forEach(clearTimeout);
  }, [isReturningFromCheckout, refresh]);

  const buy = async (itemId, currency) => {
    setBusyItem(itemId);
    try {
      await buyItem(itemId, currency);
      sfx.sparkle();
      setLumi({ mood: 'excited', line: 'Ka-ching! Pleasure doing business!' });
    } catch (error) {
      setLumi({ mood: 'worried', line: error.message });
    } finally {
      setBusyItem(null);
    }
  };

  return (
    <div className={styles.page}>
      <ScreenHeader title="Shop" />
      <main className={styles.main}>
        <div className={styles.keeper}>
          <Lumi mood={lumi.mood} size={60} line={lumi.line} />
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Shop sections">
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
              <Icon name={t.icon} size={20} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <section id="store-panel" role="tabpanel" aria-labelledby={`store-tab-${tab}`} className={styles.panel}>
          {tab === 'helpers' && <HelpersTab onBuy={buy} busyItem={busyItem} />}
          {tab === 'sparks' && <SparksTab onBuy={buy} busyItem={busyItem} />}
          {tab === 'diamonds' && <DiamondsTab onError={(message) => setLumi({ mood: 'worried', line: message })} />}
        </section>
      </main>
      <BottomNav active="store" />
    </div>
  );
}
