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
import PalShop from './store/PalShop.jsx';
import { usePlayer } from '../state/PlayerContext.jsx';
import { DIAMOND_PACKS, DIAMOND_REWARDS, HELPERS, INVENTORY_CAP, STORE_ITEMS, WEEKLY_REWARDS } from '../game/catalog.js';
import { sparkPurchasesLeft } from '../game/progress.js';
import { todayKey } from '../game/daily.js';
import { startDiamondCheckout } from '../lib/economyApi.js';
import { PAYMENTS_ENABLED, TERMS_URL } from '../lib/config.js';
import { sfx } from '../audio/sfx.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { helperText } from '../i18n/gameText.js';
import { packTag } from '../i18n/shopText.js';
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

/** A pinned paper note on the stall wall. */
function Note({ children, className = '' }) {
  return <div className={`${styles.note} ${className}`}>{children}</div>;
}

function SignInNote() {
  const { t } = useI18n();
  return (
    <Note>
      <p className={styles.noteRow}>
        <Icon name="user" size={20} />
        <span>
          {t('shop.signInNote.before')} <a href="#/settings">{t('shop.signInNote.link')}</a> {t('shop.signInNote.after')}
        </span>
      </p>
    </Note>
  );
}

function HelpersShelf({ buyProps, onInfo }) {
  const { progress } = usePlayer();
  const { t, lang } = useI18n();
  return (
    <>
      <p className={styles.shelfIntro}>
        {t('shop.helpers.intro', { cap: INVENTORY_CAP })} <strong>{sparkPurchasesLeft(progress, todayKey())}</strong>
      </p>
      <ul className={styles.shelf}>
        {helperItems.map((item) => {
          const helper = HELPERS[item.grants.helper];
          const { name, description } = helperText(lang, helper.id);
          const owned = progress.helpers[helper.id] ?? 0;
          return (
            <ShelfItem
              key={item.id}
              art={helper.id}
              title={name}
              badge={`×${owned}`}
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
      <p className={styles.shelfIntro}>{t('shop.sparks.intro')}</p>
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

function DiamondsShelf({ onError }) {
  const { isSignedIn } = usePlayer();
  const { t, lang } = useI18n();
  const [busyPack, setBusyPack] = useState(null);

  const buyPack = async (packId) => {
    setBusyPack(packId);
    try {
      window.location.assign(await startDiamondCheckout(packId));
    } catch (error) {
      onError(errorText(t, error.message));
      setBusyPack(null);
    }
  };

  return (
    <>
      <Note className={styles.freeNote}>
        <h2 className="game-title">{t('shop.free.title')}</h2>
        <ul>
          <li>
            <Icon name="check" size={18} /> {t('shop.free.world')} <strong>+{DIAMOND_REWARDS.worldComplete}</strong>
          </li>
          <li>
            <Icon name="star" size={18} /> {t('shop.free.perfect')} <strong>+{DIAMOND_REWARDS.worldPerfect}</strong>
          </li>
          <li>
            <Icon name="flame" size={18} /> {t('shop.free.streak')} <strong>+{DIAMOND_REWARDS.streakWeek}</strong>
          </li>
          <li>
            <Icon name="trophy" size={18} /> {t('shop.free.weekly')}{' '}
            <strong>{t('shop.free.range', { min: Math.min(...weeklyDiamonds), max: Math.max(...weeklyDiamonds) })}</strong>
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
                subtitle={pack.bonus > 0 ? t('shop.packs.withBonus', { bonus: pack.bonus }) : t('shop.packs.unit')}
                tag={packTag(lang, pack)}
              >
                <Button
                  size="sm"
                  className={styles.moneyTag}
                  disabled={!isSignedIn || busyPack !== null}
                  onClick={() => buyPack(pack.id)}
                  aria-label={t('shop.packs.buy', { count: pack.diamonds + pack.bonus, price: pack.displayPrice })}
                >
                  {busyPack === pack.id ? t('shop.packs.opening') : pack.displayPrice}
                </Button>
              </ShelfItem>
            ))}
          </ul>

          <p className={styles.legal}>
            <strong>{t('shop.packs.parent')}</strong> {t('shop.packs.legal')} <a href={TERMS_URL}>{t('shop.packs.terms')}</a>
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
