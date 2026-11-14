import { useEffect, useState } from 'react';
import ScreenHeader from '../components/game/ScreenHeader.jsx';
import BottomNav from '../components/game/BottomNav.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import BuyButtons from '../components/BuyButtons.jsx';
import StallFront from './store/StallFront.jsx';
import ShelfItem from './store/ShelfItem.jsx';
import ItemInfoDialog from './store/ItemInfoDialog.jsx';
import DailyGift from '../components/game/DailyGift.jsx';
import PalArt from '../components/pals/PalArt.jsx';
import { PAL_ACCESSORIES, PAL_SLOTS, stageOf } from '../game/pals.js';
import AdoptShelf from './store/AdoptShelf.jsx';
import GroveShelf from './store/GroveShelf.jsx';
import { usePlayer } from '../state/PlayerContext.jsx';
import { DIAMOND_PACKS, DIAMOND_REWARDS, HELPERS, INVENTORY_CAP, STORE_ITEMS, WEEKLY_REWARDS } from '../game/catalog.js';
import { sparkPurchasesLeft } from '../game/progress.js';
import { todayKey } from '../game/daily.js';
import { startDiamondCheckout } from '../lib/economyApi.js';
import { PAYMENTS_ENABLED, TERMS_URL } from '../lib/config.js';
import { sfx } from '../audio/sfx.js';
import { rewardShower } from '../lib/effects.js';
import styles from './store/Stall.module.css';

const TABS = [
  { id: 'helpers', label: 'Helpers', icon: 'hint' },
  { id: 'sparks', label: 'Sparks', icon: 'spark' },
  { id: 'pals', label: 'Pals', icon: 'shirt' },
  { id: 'diamonds', label: 'Diamonds', icon: 'diamond' },
];

const helperItems = STORE_ITEMS.filter((item) => item.kind === 'helper');
const sparkItems = STORE_ITEMS.filter((item) => item.kind === 'sparks');
const weeklyDiamonds = WEEKLY_REWARDS.filter((reward) => reward.diamonds > 0).map((reward) => reward.diamonds);

/** A pinned paper note on the stall wall. */
function Note({ children, className = '' }) {
  return <div className={`${styles.note} ${className}`}>{children}</div>;
}

function SignInNote() {
  return (
    <Note>
      <p className={styles.noteRow}>
        <Icon name="user" size={20} />
        <span>
          Diamonds live in your account. <a href="#/settings">Sign in with Google</a> to earn and use them.
        </span>
      </p>
    </Note>
  );
}

function HelpersShelf({ buyProps, onInfo }) {
  const { progress } = usePlayer();
  return (
    <>
      <p className={styles.shelfIntro}>
        Hold up to {INVENTORY_CAP} of each · spark buys left today: <strong>{sparkPurchasesLeft(progress, todayKey())}</strong>
      </p>
      <ul className={styles.shelf}>
        {helperItems.map((item) => {
          const helper = HELPERS[item.grants.helper];
          const owned = progress.helpers[helper.id] ?? 0;
          return (
            <ShelfItem
              key={item.id}
              art={helper.id}
              title={helper.name}
              badge={`×${owned}`}
              onInfo={() =>
                onInfo({
                  item,
                  title: helper.name,
                  art: helper.id,
                  description: helper.description,
                  facts: [
                    { icon: 'star', text: `Using it caps the level at ${helper.starCap} ★` },
                    { icon: 'bag', text: `You have ${owned} of ${INVENTORY_CAP}` },
                  ],
                })
              }
            >
              <BuyButtons item={item} itemName={helper.name} look="tag" {...buyProps(item)} />
            </ShelfItem>
          );
        })}
      </ul>
    </>
  );
}

function SparksShelf({ buyProps, onInfo }) {
  const { isSignedIn } = usePlayer();
  return (
    <>
      <p className={styles.shelfIntro}>Trade diamonds for sparks. You also earn sparks from stars, chests and daily puzzles.</p>
      <ul className={styles.shelf}>
        {sparkItems.map((item, i) => (
          <ShelfItem
            key={item.id}
            art={`sparks${i}`}
            title={`${item.grants.sparks}`}
            subtitle="sparks"
            tag={i === sparkItems.length - 1 ? 'Best value' : null}
            onInfo={() =>
              onInfo({
                item,
                title: `${item.grants.sparks} sparks`,
                art: `sparks${i}`,
                description: 'Spend sparks on Hints and Lenses. Sparks can never be turned back into diamonds.',
              })
            }
          >
            <BuyButtons item={item} itemName={`${item.grants.sparks} sparks`} look="tag" {...buyProps(item)} />
          </ShelfItem>
        ))}
      </ul>
      {!isSignedIn && <SignInNote />}
    </>
  );
}

/** Clothes for Pals, bought once with sparks. You put them on (or take them off) in Pals. */
function ClothesShelf({ onBought, onError }) {
  const { progress, buyAccessory } = usePlayer();
  const [busyItem, setBusyItem] = useState(null);
  const model = progress.pal.id ?? 'ember';
  const modelStage = stageOf(progress.pal.owned[model]);

  const buy = async (item) => {
    setBusyItem(item.id);
    try {
      await buyAccessory(item.id);
      onBought(item);
    } catch (error) {
      onError(error.message);
    } finally {
      setBusyItem(null);
    }
  };

  return (
    <>
      <p className={styles.shelfIntro}>
        Clothes and gear are yours forever. Put them on in <a href="#/pals">Pals → Wardrobe</a>.
      </p>
      {PAL_SLOTS.map((slot) => (
        <section key={slot.id} aria-labelledby={`slot-${slot.id}`}>
          <h3 id={`slot-${slot.id}`} className={`game-title ${styles.slotHeading}`}>
            {slot.name}
          </h3>
          <ul className={styles.shelf}>
            {PAL_ACCESSORIES.filter((item) => item.slot === slot.id).map((item) => {
              const isOwned = progress.pal.accessories.includes(item.id);
              return (
                <ShelfItem
                  key={item.id}
                  artNode={<PalArt palId={model} stage={modelStage} wearing={[item.id]} size={92} className={styles.goodsArt} />}
                  title={item.name}
                >
                  {isOwned ? (
                    <span className={styles.ownedTag}>
                      <Icon name="check" size={16} /> Owned
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="gold"
                      disabled={busyItem !== null || progress.sparks < item.price}
                      onClick={() => buy(item)}
                      aria-label={`Buy ${item.name} for ${item.price} sparks`}
                    >
                      <Icon name="spark" size={16} />
                      <span>{item.price}</span>
                    </Button>
                  )}
                </ShelfItem>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}

function DiamondsShelf({ onError }) {
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
      <Note className={styles.freeNote}>
        <h2 className="game-title">Free diamonds!</h2>
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
          <li>
            <Icon name="trophy" size={18} /> Weekly top 3{' '}
            <strong>
              +{Math.min(...weeklyDiamonds)} to +{Math.max(...weeklyDiamonds)}
            </strong>
          </li>
        </ul>
      </Note>

      {!isSignedIn && <SignInNote />}

      {/* Diamond packs are sold on the website only; in the app, diamonds are earned by playing. */}
      {PAYMENTS_ENABLED && (
        <>
          <ul className={styles.shelf}>
            {DIAMOND_PACKS.map((pack, i) => (
              <ShelfItem
                key={pack.id}
                art={`diamonds${i}`}
                title={`${pack.diamonds + pack.bonus}`}
                subtitle={pack.bonus > 0 ? `diamonds (+${pack.bonus} bonus)` : 'diamonds'}
                tag={pack.tag}
              >
                <Button
                  size="sm"
                  className={styles.moneyTag}
                  disabled={!isSignedIn || busyPack !== null}
                  onClick={() => buyPack(pack.id)}
                  aria-label={`Buy ${pack.diamonds + pack.bonus} diamonds for ${pack.displayPrice}`}
                >
                  {busyPack === pack.id ? 'Opening…' : pack.displayPrice}
                </Button>
              </ShelfItem>
            ))}
          </ul>

          <p className={styles.legal}>
            <strong>Under 18? Ask a parent or guardian before buying.</strong> One-time purchases, no subscriptions, no random rewards. Payments by
            our partner Lemon Squeezy. <a href={TERMS_URL}>Terms & refunds</a>
          </p>
        </>
      )}
    </>
  );
}

/** The shop, drawn as Lumi's market stall: an awning, a counter, signs and shelves of goods. */
export default function StoreScreen({ isReturningFromCheckout = false }) {
  const { progress, isSignedIn, buyItem, refresh } = usePlayer();
  const [tab, setTab] = useState(isReturningFromCheckout ? 'diamonds' : 'helpers');
  const [busyItem, setBusyItem] = useState(null);
  const [info, setInfo] = useState(null);
  const [lumi, setLumi] = useState(() =>
    isReturningFromCheckout
      ? { mood: 'dance', line: 'Thank you! Your diamonds are on their way!' }
      : {
          mood: 'happy',
          line: 'Welcome to my stall! Tap anything for a closer look.',
        },
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
      sfx.coin();
      setLumi({ mood: 'dance', line: 'Ka-ching! Pleasure doing business!' });
      setInfo(null);
    } catch (error) {
      setLumi({ mood: 'worried', line: error.message });
    } finally {
      setBusyItem(null);
    }
  };

  const buyProps = (item) => ({
    progress,
    isSignedIn,
    isBusy: busyItem === item.id,
    onBuy: (currency) => buy(item.id, currency),
  });

  return (
    <div className={styles.page}>
      <ScreenHeader title="Shop" />
      <main className={styles.stall}>
        <StallFront lumiMood={lumi.mood} lumiLine={lumi.line} />

        <div className={styles.signs} role="tablist" aria-label="Shop sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`store-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="store-panel"
              className={`${styles.sign} ${tab === t.id ? styles.signActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={18} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <section id="store-panel" role="tabpanel" aria-labelledby={`store-tab-${tab}`} className={styles.wall}>
          <DailyGift look="note" />
          {tab === 'helpers' && <HelpersShelf buyProps={buyProps} onInfo={setInfo} />}
          {tab === 'sparks' && <SparksShelf buyProps={buyProps} onInfo={setInfo} />}
          {tab === 'pals' && (
            <>
              <AdoptShelf
                onAdopted={(pal) => {
                  sfx.newPal();
                  rewardShower();
                  setLumi({
                    mood: 'dance',
                    line: `Welcome home, ${pal.name}! Find them in Pals.`,
                  });
                }}
                onError={(message) => setLumi({ mood: 'worried', line: message })}
              />
              <h2 className={`game-title ${styles.sectionTitle}`}>Clothes & gear</h2>
              <ClothesShelf
                onBought={(item) => {
                  sfx.coin();
                  setLumi({
                    mood: 'dance',
                    line: `Ooh, the ${item.name.toLowerCase()}! Try it on in Pals.`,
                  });
                }}
                onError={(message) => setLumi({ mood: 'worried', line: message })}
              />
              <h2 className={`game-title ${styles.sectionTitle}`}>Grove decor</h2>
              <GroveShelf
                onBought={(item) => {
                  sfx.coin();
                  setLumi({ mood: 'dance', line: `The ${item.name.toLowerCase()} will look lovely in the Grove!` });
                }}
                onError={(message) => setLumi({ mood: 'worried', line: message })}
              />
            </>
          )}
          {tab === 'diamonds' && <DiamondsShelf onError={(message) => setLumi({ mood: 'worried', line: message })} />}
        </section>
      </main>
      <BottomNav active="store" />

      {info && (
        <ItemInfoDialog info={info} onClose={() => setInfo(null)}>
          <BuyButtons item={info.item} itemName={info.title} {...buyProps(info.item)} />
        </ItemInfoDialog>
      )}
    </div>
  );
}
