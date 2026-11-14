import { useEffect, useRef, useState } from 'react';
import Dialog from '../Dialog.jsx';
import Button from '../Button.jsx';
import Icon from '../Icon.jsx';
import RewardShower from '../RewardShower.jsx';
import GiftBoxArt from './GiftBoxArt.jsx';
import GiftItemArt from './GiftItemArt.jsx';
import { giftItems } from '../../i18n/giftText.js';
import { PRESENT_RARITIES, mergeGifts } from '../../game/gifts.js';
import { gemBurst } from '../../lib/effects.js';
import { errorText } from '../../i18n/meText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { sfx } from '../../audio/sfx.js';
import styles from './GiftReveal.module.css';

const SHAKE_MS = 700;
const CHARGE_STEP_MS = 650;
const ITEM_GAP_MS = 380;
const NEXT_GIFT_MS = 1100;
/** Each step a present glows up to, plain → rare → epic → legendary: its color, its light and a symbol (never color alone). */
const GLOW_LOOKS = [
  { tone: 'mint', symbol: '', light: '#4FBFAD' },
  { tone: 'peach', symbol: '◆', light: '#F2A67E' },
  { tone: 'honey', symbol: '★', light: '#F0C14E' },
  { tone: 'gold', symbol: '✦', light: '#FFD54A' },
];
const prefersCalm = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const rarityStep = (gift) =>
  Math.max(
    0,
    PRESENT_RARITIES.findIndex((rarity) => rarity.id === gift.rarity),
  );

/**
 * The gift moment, the same for every gift: a wrapped box (or chest) waits for a tap, wobbles and pops open, and
 * the things inside come out one by one with a chime. Several gifts (`count`) open one after another in the same
 * window, then everything is summed up. A present (`charges`) first charges up: a bar fills, and at each notch it
 * reaches it glows up a rarity (color, light, symbol, sound). Tapping hurries everything along.
 * @param title      heading before opening ("Day 3 gift", "Ember found 3 presents!")
 * @param doneTitle  heading once open
 * @param wrapping   { kind: 'box', tone, isBig } or { kind: 'chest' }
 * @param open       () => Promise<gift> ({ sparks, helper?, diamonds?, item?, rarity? }); called once per gift
 * @param partner    the Pal an outfit is for (for its picture and wording)
 * @param children   shown under the gifts once everything is out (Lumi's line, the calendar…)
 */
export default function GiftReveal({
  title,
  doneTitle,
  wrapping = { kind: 'box', tone: 'honey' },
  open,
  count = 1,
  charges = false,
  partner = null,
  onClose,
  children,
}) {
  const { t, lang } = useI18n();
  const [phase, setPhase] = useState('wrapped'); // wrapped | charging | open | done | error
  const [openedCount, setOpenedCount] = useState(0);
  const [glow, setGlow] = useState(0);
  const [charge, setCharge] = useState(0);
  const [items, setItems] = useState([]);
  const [shown, setShown] = useState(0);
  const [error, setError] = useState('');
  const boxRef = useRef(null);
  const hurry = useRef(null);
  const isMounted = useRef(true);
  const isBig = Boolean(wrapping.isBig);

  useEffect(
    () => () => {
      isMounted.current = false;
      hurry.current?.();
    },
    [],
  );

  // A pause that a tap can cut short (and that's skipped for reduced motion).
  const pause = (ms) =>
    new Promise((resolve) => {
      const id = setTimeout(resolve, prefersCalm() ? 0 : ms);
      hurry.current = () => {
        clearTimeout(id);
        resolve();
      };
    });

  const glowUp = (step) => {
    setGlow(step);
    sfx.glowUp(step);
    gemBurst(boxRef.current, GLOW_LOOKS[step].light);
  };

  const showItems = async (list) => {
    setItems(list);
    setShown(0);
    for (let i = 0; i < list.length; i++) {
      await pause(i === 0 ? 350 : ITEM_GAP_MS);
      if (!isMounted.current) return;
      setShown(i + 1);
      sfx.giftItem(i);
    }
  };

  const start = async () => {
    if (phase !== 'wrapped') return;
    const opened = [];
    for (let i = 0; i < count; i++) {
      setGlow(0);
      setCharge(0);
      setItems([]);
      setPhase('charging');
      sfx.giftShake();
      let gift;
      try {
        [gift] = await Promise.all([open(), pause(SHAKE_MS)]);
      } catch (failure) {
        if (!isMounted.current) return;
        if (opened.length) break;
        setError(errorText(t, failure.message));
        setPhase('error');
        return;
      }
      if (!isMounted.current) return;
      if (charges) {
        // Charging: the bar fills notch by notch; each notch the present reaches makes it glow up.
        const steps = rarityStep(gift);
        for (let step = 1; step < GLOW_LOOKS.length; step++) {
          setCharge(step / GLOW_LOOKS.length);
          await pause(CHARGE_STEP_MS);
          if (step > steps) break;
          glowUp(step);
        }
        setCharge(1);
        await pause(250);
      }
      if (!isMounted.current) return;
      setPhase('open');
      sfx.giftOpen({ isBig: isBig || rarityStep(gift) >= 2 });
      setOpenedCount(i + 1);
      await showItems(giftItems(lang, gift, partner));
      opened.push(gift);
      if (i < count - 1) await pause(NEXT_GIFT_MS);
      if (!isMounted.current) return;
    }
    // Everything together at the end (for several gifts, a summary).
    if (opened.length > 1) {
      setGlow(0);
      setItems(giftItems(lang, mergeGifts(opened), partner));
    }
    setShown(Infinity);
    setPhase('done');
  };

  // Several presents: no sentence, just the pile and a number counting down as each one opens.
  const isPile = count > 1;
  const left = count - openedCount;
  const heading = phase === 'done' ? doneTitle : phase === 'error' ? t('ui.hmm') : title;
  const look = GLOW_LOOKS[glow];

  return (
    <Dialog
      title={heading}
      hideTitle={isPile && phase !== 'done'}
      tone="celebrate"
      onClose={phase === 'wrapped' || phase === 'done' || phase === 'error' ? onClose : undefined}
    >
      <div className={styles.stage} onClick={() => hurry.current?.()} role="presentation">
        {isPile && phase !== 'done' && (
          <span className={styles.pile} aria-hidden="true">
            {Array.from({ length: Math.max(0, left - 1) }, (_, i) => (
              <GiftBoxArt key={i} tone={wrapping.tone} phase="still" size={34} />
            ))}
          </span>
        )}
        {glow > 0 && phase !== 'done' && <span className={styles.rays} style={{ '--ray': look.light }} aria-hidden="true" />}
        <button
          type="button"
          ref={boxRef}
          className={`${styles.wrapped} ${phase === 'open' || phase === 'done' ? styles.open : ''}`}
          onClick={start}
          disabled={phase !== 'wrapped'}
          aria-label={t('gift.tapToOpen')}
          data-autofocus
        >
          {wrapping.kind === 'chest' ? (
            <span className={`${styles.chest} ${styles[`chest-${phase === 'done' ? 'open' : phase}`]}`}>
              <Icon name="chest" size={isBig ? 120 : 104} />
            </span>
          ) : (
            <GiftBoxArt
              tone={glow > 0 ? look.tone : wrapping.tone}
              phase={phase === 'charging' ? 'shaking' : phase === 'open' || phase === 'done' ? 'open' : 'wrapped'}
              size={isBig || glow >= 3 ? 150 : 124}
              isBig={isBig}
            />
          )}
          {isPile && phase !== 'done' && (
            <span key={left} className={`game-title ${styles.countdown}`} aria-hidden="true">
              {left}
            </span>
          )}
        </button>
        {glow > 0 && phase !== 'done' && (
          // Rarity reads from color, light and a big symbol; the word is only for screen readers.
          <span key={glow} className={`${styles.glowMark} ${styles[`glow${glow}`]}`} role="status">
            <span aria-hidden="true">{look.symbol}</span>
            <span className="visually-hidden">{t(`present.rarity.${PRESENT_RARITIES[glow].id}`)}</span>
          </span>
        )}
        {charges && phase === 'charging' && (
          <span className={styles.charge} aria-hidden="true">
            <span className={styles.chargeFill} style={{ width: `${charge * 100}%`, background: look.light }} />
            {GLOW_LOOKS.slice(1).map((step, i) => (
              <span key={step.symbol} className={styles.notch} style={{ insetInlineStart: `${((i + 1) / GLOW_LOOKS.length) * 100}%` }}>
                {step.symbol}
              </span>
            ))}
          </span>
        )}
        {phase === 'wrapped' && (
          <p className={`game-title ${styles.prompt}`} aria-hidden="true">
            {t('gift.tapToOpen')}
          </p>
        )}
        {(phase === 'open' || phase === 'done') && (
          <ul className={styles.items} aria-live="polite">
            {items.slice(0, shown).map((item) => (
              <li key={item.key} className={styles.item}>
                <span className={styles.itemArt} aria-hidden="true">
                  <GiftItemArt art={item.art} partner={partner} size={60} />
                </span>
                <span className={`game-title ${styles.itemText}`}>{item.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {phase === 'error' && (
        <>
          <p className={styles.error}>{error}</p>
          <Button onClick={onClose} data-autofocus>
            {t('ui.ok')}
          </Button>
        </>
      )}
      {phase === 'done' && (
        <div className={styles.after}>
          {children}
          <Button size="lg" variant="go" onClick={onClose} data-autofocus>
            {t('ui.gift.yay')}
          </Button>
          <RewardShower />
        </div>
      )}
    </Dialog>
  );
}
