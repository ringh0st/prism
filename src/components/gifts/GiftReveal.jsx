import { useEffect, useRef, useState } from 'react';
import Dialog from '../Dialog.jsx';
import Button from '../Button.jsx';
import Icon from '../Icon.jsx';
import RewardShower from '../RewardShower.jsx';
import GiftBoxArt from './GiftBoxArt.jsx';
import GiftItemArt from './GiftItemArt.jsx';
import { giftItems } from '../../i18n/giftText.js';
import { PRESENT_RARITIES } from '../../game/gifts.js';
import { gemBurst } from '../../lib/effects.js';
import { errorText } from '../../i18n/meText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { sfx } from '../../audio/sfx.js';
import styles from './GiftReveal.module.css';

const SHAKE_MS = 900;
const GLOW_STEP_MS = 750;
/** Each step a present glows up to, plain → rare → epic → legendary: its color and a symbol (never color alone). */
const GLOW_LOOKS = [
  { tone: 'mint', symbol: '', light: null },
  { tone: 'peach', symbol: '◆', light: '#F2A67E' },
  { tone: 'honey', symbol: '★', light: '#F0C14E' },
  { tone: 'gold', symbol: '✦', light: '#FFD54A' },
];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ITEM_GAP_MS = 380;
const prefersCalm = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * The gift moment, the same for every gift: a wrapped box (or chest) waits for a tap, wobbles, pops open,
 * and the things inside come out one by one with a chime. Tapping during the reveal shows everything at once.
 * @param title      heading before opening ("Day 3 gift", "Ember found a present!")
 * @param doneTitle  heading once open
 * @param wrapping   { kind: 'box', tone, isBig } or { kind: 'chest' }
 * @param open       () => Promise<gift> ({ sparks, helper?, diamonds?, item? }); called on the tap
 * @param partner    the Pal an outfit is for (for its picture and wording)
 * @param children   shown under the gifts once everything is out (Lumi's line, the calendar…)
 */
export default function GiftReveal({ title, doneTitle, wrapping = { kind: 'box', tone: 'honey' }, open, partner = null, onClose, children }) {
  const { t, lang } = useI18n();
  const [phase, setPhase] = useState('wrapped'); // wrapped | shaking | glowing | open | error
  const [glow, setGlow] = useState(0);
  const boxRef = useRef(null);
  const [items, setItems] = useState([]);
  const [shown, setShown] = useState(0);
  const [error, setError] = useState('');
  const isBig = Boolean(wrapping.isBig);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const start = async () => {
    if (phase !== 'wrapped') return;
    setPhase('shaking');
    sfx.giftShake();
    const calm = prefersCalm();
    try {
      const [gift] = await Promise.all([open(), new Promise((resolve) => setTimeout(resolve, calm ? 0 : SHAKE_MS))]);
      // A present that turned out special glows up a step at a time before it opens (decided already: this is the reveal).
      const steps = Math.max(
        0,
        PRESENT_RARITIES.findIndex((rarity) => rarity.id === gift.rarity),
      );
      for (let step = 1; step <= steps; step++) {
        setPhase('glowing');
        setGlow(step);
        sfx.glowUp(step);
        gemBurst(boxRef.current, GLOW_LOOKS[step].light);
        await wait(calm ? 0 : GLOW_STEP_MS);
      }
      const list = giftItems(lang, gift, partner);
      setItems(list);
      setPhase('open');
      sfx.giftOpen({ isBig: isBig || steps >= 2 });
      list.forEach((_, i) =>
        later(
          () => {
            setShown((count) => Math.max(count, i + 1));
            sfx.giftItem(i);
          },
          calm ? 0 : 450 + i * ITEM_GAP_MS,
        ),
      );
    } catch (failure) {
      setError(errorText(t, failure.message));
      setPhase('error');
    }
  };

  const showAll = () => {
    if (phase !== 'open' || shown >= items.length) return;
    timers.current.forEach(clearTimeout);
    setShown(items.length);
  };

  const isDone = phase === 'open' && shown >= items.length;
  const heading = phase === 'open' ? doneTitle : phase === 'error' ? t('ui.hmm') : title;

  return (
    <Dialog title={heading} tone="celebrate" onClose={phase === 'shaking' ? undefined : onClose}>
      <div className={styles.stage} onClick={showAll}>
        {glow > 0 && <span className={styles.rays} style={{ '--ray': GLOW_LOOKS[glow].light }} aria-hidden="true" />}
        <button
          type="button"
          ref={boxRef}
          className={`${styles.wrapped} ${styles[phase]}`}
          onClick={start}
          disabled={phase !== 'wrapped'}
          aria-label={t('gift.tapToOpen')}
          data-autofocus
        >
          {wrapping.kind === 'chest' ? (
            <span className={`${styles.chest} ${styles[`chest-${phase}`]}`}>
              <Icon name="chest" size={isBig ? 120 : 104} />
            </span>
          ) : (
            <GiftBoxArt
              tone={glow > 0 ? GLOW_LOOKS[glow].tone : wrapping.tone}
              phase={phase === 'error' ? 'wrapped' : phase === 'glowing' ? 'shaking' : phase}
              size={isBig || glow >= 3 ? 150 : 124}
              isBig={isBig}
            />
          )}
        </button>
        {glow > 0 && (
          // Rarity reads from color, light and a big symbol; the word is only for screen readers.
          <span key={glow} className={`${styles.glowMark} ${styles[`glow${glow}`]}`} role="status">
            <span aria-hidden="true">{GLOW_LOOKS[glow].symbol}</span>
            <span className="visually-hidden">{t(`present.rarity.${PRESENT_RARITIES[glow].id}`)}</span>
          </span>
        )}
        {phase === 'wrapped' && (
          <p className={`game-title ${styles.prompt}`} aria-hidden="true">
            {t('gift.tapToOpen')}
          </p>
        )}
        {phase === 'open' && (
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
      {isDone && (
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
