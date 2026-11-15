import Icon from '../../components/Icon.jsx';
import { sfx } from '../../audio/sfx.js';
import ShopItemArt from '../store/ShopItemArt.jsx';
import { BOOSTER_IDS, storeItem } from '../../game/catalog.js';
import { helperText } from '../../i18n/gameText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './BoosterPicker.module.css';

/**
 * The three boosters on the level card, as pictures: how many you hold, a check once picked, the price when you
 * have none (a tap then offers to buy one). Picked boosters are used when the level starts. A win streak's
 * free boosters (`free`) are already on, marked with a flame and the streak's length.
 */
export default function BoosterPicker({ owned, chosen, free = [], streak = 0, onToggle }) {
  const { t, lang } = useI18n();
  return (
    <ul className={styles.picker} aria-label={t('boosters.title')}>
      {BOOSTER_IDS.map((id) => {
        const count = owned[id] ?? 0;
        const isFree = free.includes(id);
        const isChosen = isFree || chosen.includes(id);
        const { name } = helperText(lang, id);
        return (
          <li key={id}>
            <button
              type="button"
              className={`${styles.booster} ${isChosen ? styles.chosen : ''} ${isFree ? styles.free : ''} ${count < 1 && !isFree ? styles.empty : ''}`}
              aria-pressed={isFree || count > 0 ? isChosen : undefined}
              aria-label={
                isFree
                  ? t('boosters.free', { name, count: streak })
                  : count > 0
                    ? t('boosters.pick', { name, count })
                    : t('boosters.buy', { name, price: storeItem(id).price.sparks })
              }
              onClick={(event) => {
                event.stopPropagation();
                if (isFree) return;
                if (count > 0) sfx.boosterPick(!isChosen);
                else sfx.tap();
                onToggle(id);
              }}
            >
              <ShopItemArt art={id} size={46} />
              <span className={`game-title ${styles.badge}`} aria-hidden="true">
                {isFree ? (
                  <>
                    <Icon name="flame" size={13} />
                    {streak}
                  </>
                ) : isChosen ? (
                  <Icon name="check" size={14} strokeWidth={3.4} />
                ) : count > 0 ? (
                  count
                ) : (
                  <Icon name="plus" size={12} strokeWidth={3.4} />
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
