import { useEffect, useRef, useState } from 'react';
import ScreenHeader from '../components/game/ScreenHeader.jsx';
import BottomNav from '../components/game/BottomNav.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import BuyButtons from '../components/BuyButtons.jsx';
import StallFront from './store/StallFront.jsx';
import ShelfItem from './store/ShelfItem.jsx';
import ItemInfoDialog from './store/ItemInfoDialog.jsx';
import DailyGift from '../components/game/DailyGift.jsx';
import PalShop from './store/PalShop.jsx';
import HelpTip from '../components/game/HelpTip.jsx';
import SignInNote from './store/SignInNote.jsx';
import BuysLeft from './store/BuysLeft.jsx';
import { usePlayer } from '../state/PlayerContext.jsx';
import { DAILY_SPARK_PURCHASE_LIMIT, DIAMOND_PACKS, DIAMOND_REWARDS, INVENTORY_CAP, STORE_ITEMS, WEEKLY_REWARDS, toolFor } from '../game/catalog.js';
import { sparkPurchasesLeft } from '../game/progress.js';
import { todayKey } from '../game/daily.js';
import { startDiamondCheckout } from '../lib/economyApi.js';
import { flyRewardsToCounter } from '../lib/rewardFlight.js';
import { APPLE_PURCHASES_ENABLED, PAYMENTS_ENABLED, TERMS_URL } from '../lib/config.js';
import { buyDiamondPackInApp, fetchApplePrices } from '../lib/applePurchases.js';
import { useAuth } from '../state/AuthContext.jsx';
import { sfx } from '../audio/sfx.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { helperText } from '../i18n/gameText.js';
import { packTag } from '../i18n/shopText.js';
import { errorText } from '../i18n/meText.js';
import styles from './store/Stall.module.css';

const TABS = [
  { id: 'helpers', icon: 'hint' },
  { id: 'sparks', icon: 'spark' },
  { id: 'pals', icon: 'shirt' },
  { id: 'diamonds', icon: 'diamond' },
];

const helperItems = STORE_ITEMS.filter((item) => item.kind === 'helper');
const sparkItems = STORE_ITEMS.filter((item) => item.kind === 'sparks');
const weeklyDiamonds = WEEKLY_REWARDS.filter((reward) => reward.diamonds > 0).map((reward) => reward.diamonds);

function HelpersShelf({ buyProps, onInfo }) {
  const { progress } = usePlayer();
  const { t, lang } = useI18n();
  return (
    <>
      <div className={styles.shelfBar}>
        <BuysLeft left={sparkPurchasesLeft(progress, todayKey())} />
        <HelpTip title={t('shop.helpers.helpTitle')}>
          <p>{t('shop.helpers.helpCap', { cap: INVENTORY_CAP })}</p>
          <p>{t('shop.helpers.helpDaily', { count: DAILY_SPARK_PURCHASE_LIMIT })}</p>
          <p>{t('shop.helpers.helpStars')}</p>
        </HelpTip>
      </div>
      <ul className={styles.shelf}>
        {helperItems.map((item) => {
          const helper = toolFor(item.grants.helper);
          const { name, description } = helperText(lang, helper.id);
          const owned = progress.helpers[helper.id] ?? 0;
          return (
            <ShelfItem
              key={item.id}
              art={helper.id}
              title={name}
              badge={`${owned}/${INVENTORY_CAP}`}
              onInfo={() =>
                onInfo({
                  item,
                  title: name,
                  art: helper.id,
                  description,
                  facts: [
                    { icon: 'star', text: t('shop.helpers.starCap', { stars: helper.starCap }) },
                    { icon: 'bag', text: t('shop.helpers.owned', { owned, cap: INVENTORY_CAP }) },
                  ],
                })
              }
            >
              <BuyButtons item={item} itemName={name} look="tag" {...buyProps(item)} />
            </ShelfItem>
          );
        })}
      </ul>
    </>
  );
}

function SparksShelf({ buyProps, onInfo }) {
  const { isSignedIn } = usePlayer();
  const { t } = useI18n();
  return (
    <>
      <ul className={styles.shelf}>
        {sparkItems.map((item, i) => {
          const amount = t('shop.sparks.amount', { count: item.grants.sparks });
          return (
            <ShelfItem
              key={item.id}
              art={`sparks${i}`}
              title={`${item.grants.sparks}`}
              subtitle={t('shop.sparks.unit')}
              tag={i === sparkItems.length - 1 ? t('shop.bestValue') : null}
              onInfo={() =>
                onInfo({
                  item,
                  title: amount,
                  art: `sparks${i}`,
                  description: t('shop.sparks.description'),
                })
              }
            >
              <BuyButtons item={item} itemName={amount} look="tag" {...buyProps(item)} />
            </ShelfItem>
          );
        })}
      </ul>
      {!isSignedIn && <SignInNote />}
    </>
  );
}

/** Ways to earn diamonds for free, as icon tiles with big numbers. */
function FreeDiamonds() {
  const { t } = useI18n();
  const ways = [
    // Isolated so "+1" keeps its sign in front in right-to-left text.
    { id: 'world', icon: 'check', amount: `\u2066+${DIAMOND_REWARDS.worldComplete}\u2069` },
    { id: 'perfect', icon: 'star', amount: `\u2066+${DIAMOND_REWARDS.worldPerfect}\u2069` },
    { id: 'streak', icon: 'flame', amount: `\u2066+${DIAMOND_REWARDS.streakWeek}\u2069` },
    { id: 'weekly', icon: 'trophy', amount: t('shop.free.range', { min: Math.min(...weeklyDiamonds), max: Math.max(...weeklyDiamonds) }) },
  ];
  return (
    <section className={styles.freeNote} aria-labelledby="free-diamonds">
      <h2 id="free-diamonds" className="game-title">
        <Icon name="diamond" size={20} /> {t('shop.free.title')}
      </h2>
      <ul>
        {ways.map((way) => (
          <li key={way.id}>
            <Icon name={way.icon} size={22} />
            <strong>{way.amount}</strong>
            <span>{t(`shop.free.${way.id}`)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DiamondsShelf({ onError, onBuying }) {
  const { isSignedIn, refresh } = usePlayer();
  const { user } = useAuth();
  // In the iPhone app the App Store gives each pack's price in the player's own currency.
  // When the App Store doesn't answer (offline, products not ready), the packs say so and offer a retry
  // instead of waiting on "…" forever.
  const [applePrices, setApplePrices] = useState(null);
  const [priceTry, setPriceTry] = useState(0);
  useEffect(() => {
    if (!APPLE_PURCHASES_ENABLED) return;
    setApplePrices(null);
    fetchApplePrices()
      .then(setApplePrices)
      .catch(() => setApplePrices({}));
  }, [priceTry]);
  const isStoreDown = APPLE_PURCHASES_ENABLED && applePrices !== null && DIAMOND_PACKS.every((pack) => !applePrices[pack.id]);
  const priceOf = (pack) => (APPLE_PURCHASES_ENABLED ? applePrices?.[pack.id] : pack.displayPrice);
  const { t, lang } = useI18n();
  const [busyPack, setBusyPack] = useState(null);

  const buyPack = async (packId) => {
    setBusyPack(packId);
    try {
      if (APPLE_PURCHASES_ENABLED) {
        onBuying();
        if (await buyDiamondPackInApp(packId, user.id)) await refresh();
        setBusyPack(null);
        return;
      }
      window.location.assign(await startDiamondCheckout(packId));
    } catch (error) {
      onError(errorText(t, error.message));
      setBusyPack(null);
    }
  };

  return (
    <>
      <FreeDiamonds />

      {!isSignedIn && <SignInNote />}

      {/* Diamond packs: a checkout page on the website, Apple's in-app purchase in the iPhone app. */}
      {PAYMENTS_ENABLED && (
        <>
          <ul className={styles.shelf}>
            {DIAMOND_PACKS.map((pack, i) => (
              <ShelfItem
                key={pack.id}
                art={`diamonds${i}`}
                title={`${pack.diamonds + pack.bonus}`}
                subtitle={pack.bonus > 0 ? <span className={styles.bonusChip}>{t('shop.packs.bonus', { bonus: pack.bonus })}</span> : null}
                tag={packTag(lang, pack)}
              >
                <Button
                  className={styles.moneyTag}
                  disabled={!isSignedIn || busyPack !== null || !priceOf(pack)}
                  onClick={() => buyPack(pack.id)}
                  aria-label={t('shop.packs.buy', { count: pack.diamonds + pack.bonus, price: priceOf(pack) ?? '' })}
                >
                  {busyPack === pack.id ? t('shop.packs.opening') : (priceOf(pack) ?? '…')}
                </Button>
              </ShelfItem>
            ))}
          </ul>

          {isStoreDown && (
            <p className={styles.storeDown} role="status">
              <span>{t('shop.packs.storeDown')}</span>
              <Button size="sm" variant="secondary" onClick={() => setPriceTry((n) => n + 1)}>
                {t('shop.packs.retry')}
              </Button>
            </p>
          )}

          <p className={styles.legal}>
            <Icon name="shield" size={16} />
            <span>
              <strong>{t('shop.packs.parent')}</strong> {t(APPLE_PURCHASES_ENABLED ? 'shop.packs.legalApp' : 'shop.packs.legal')}{' '}
              <a href={TERMS_URL}>{t('shop.packs.terms')}</a>
            </span>
          </p>
        </>
      )}
    </>
  );
}

/** The shop, drawn as Lumi's market stall: an awning, a counter, signs and shelves of goods. */
export default function StoreScreen({ isReturningFromCheckout = false }) {
  const { progress, isSignedIn, buyItem, refresh } = usePlayer();
  const { t } = useI18n();
  const [tab, setTab] = useState(isReturningFromCheckout ? 'diamonds' : 'helpers');
  const [busyItem, setBusyItem] = useState(null);
  const [info, setInfo] = useState(null);
  const [lumi, setLumi] = useState(() =>
    isReturningFromCheckout ? { mood: 'dance', line: t('shop.lumi.thanks') } : { mood: 'happy', line: t('shop.lumi.welcome') },
  );

  // After checkout the payment webhook adds the diamonds; check back a few times, and when they arrive they fly
  // into the diamond counter.
  useEffect(() => {
    if (!isReturningFromCheckout) return undefined;
    const timers = [1500, 4000, 8000, 15000, 25000].map((ms) => setTimeout(refresh, ms));
    return () => timers.forEach(clearTimeout);
  }, [isReturningFromCheckout, refresh]);
  // Bought diamonds are on their way: back from the web checkout, or after a purchase in the app.
  const [isAwaitingDiamonds, setIsAwaitingDiamonds] = useState(isReturningFromCheckout);
  const diamondsBefore = useRef(null);
  useEffect(() => {
    if (!isAwaitingDiamonds || !isSignedIn) return;
    if (diamondsBefore.current === null) {
      diamondsBefore.current = progress.diamonds;
      return;
    }
    const arrived = progress.diamonds - diamondsBefore.current;
    diamondsBefore.current = progress.diamonds;
    if (arrived > 0) {
      flyRewardsToCounter('diamond', arrived);
      setLumi({ mood: 'dance', line: t('shop.lumi.arrived', { count: arrived }) });
    }
  }, [isAwaitingDiamonds, isSignedIn, progress.diamonds, t]);

  const buy = async (itemId, currency) => {
    setBusyItem(itemId);
    try {
      await buyItem(itemId, currency);
      sfx.coin();
      setLumi({ mood: 'dance', line: t('shop.lumi.kaching') });
      setInfo(null);
    } catch (error) {
      setLumi({ mood: 'worried', line: errorText(t, error.message) });
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
      <ScreenHeader title={t('shop.title')} />
      <main className={styles.stall}>
        <StallFront lumiMood={lumi.mood} lumiLine={lumi.line} />

        <div className={styles.signs} role="tablist" aria-label={t('shop.sections')}>
          {TABS.map((sign) => (
            <button
              key={sign.id}
              type="button"
              role="tab"
              id={`store-tab-${sign.id}`}
              aria-selected={tab === sign.id}
              aria-controls="store-panel"
              className={`${styles.sign} ${tab === sign.id ? styles.signActive : ''}`}
              onClick={() => setTab(sign.id)}
            >
              <Icon name={sign.icon} size={18} />
              <span>{t(`shop.tab.${sign.id}`)}</span>
            </button>
          ))}
        </div>

        <section id="store-panel" role="tabpanel" aria-labelledby={`store-tab-${tab}`} className={styles.wall}>
          <DailyGift look="note" />
          {tab === 'helpers' && <HelpersShelf buyProps={buyProps} onInfo={setInfo} />}
          {tab === 'sparks' && <SparksShelf buyProps={buyProps} onInfo={setInfo} />}
          {tab === 'pals' && <PalShop onLumi={setLumi} onGetDiamonds={() => setTab('diamonds')} />}
          {tab === 'diamonds' && (
            <DiamondsShelf onError={(message) => setLumi({ mood: 'worried', line: message })} onBuying={() => setIsAwaitingDiamonds(true)} />
          )}
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
