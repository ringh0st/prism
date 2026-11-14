import { useState } from 'react';
import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import GroveScene from '../../components/grove/GroveScene.jsx';
import GroveItemArt from '../../components/grove/GroveItemArt.jsx';
import HelpTip from '../../components/game/HelpTip.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { ALL_DECOR, GROVE_ITEMS, GROVE_SPOTS } from '../../game/grove.js';
import { finishedWorldCount } from '../../game/titles.js';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { decorName, spotName } from '../../i18n/groveText.js';
import styles from './Grove.module.css';
import { errorText } from '../../i18n/meText.js';

/** One piece of decor: buy it, place it, or put it away. */
function DecorItem({ item, onDone, onError }) {
  const { progress, buyGroveItem, placeGroveItem } = usePlayer();
  const { t, lang } = useI18n();
  const [isBusy, setIsBusy] = useState(false);
  const name = decorName(lang, item);
  const isOwned = progress.grove.items.includes(item.id);
  const isPlaced = progress.grove.placed.includes(item.id);

  const act = async (action, message, sound) => {
    setIsBusy(true);
    try {
      await action();
      sound();
      onDone(message);
    } catch (error) {
      onError(errorText(t, error.message));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <li className={`${styles.item} ${isPlaced ? styles.placed : ''}`}>
      <span className={styles.itemArt}>
        <GroveItemArt id={item.id} size={64} />
        {isPlaced && (
          <span className={styles.placedMark} aria-hidden="true">
            <Icon name="check" size={14} strokeWidth={3} />
          </span>
        )}
      </span>
      <span className={styles.itemName}>{name}</span>
      {!isOwned ? (
        <Button
          size="sm"
          variant="gold"
          disabled={isBusy || progress.sparks < item.price}
          onClick={() => act(() => buyGroveItem(item.id), t('grove.bought', { name }), sfx.coin)}
          aria-label={t('grove.buy', { name, price: item.price })}
        >
          <Icon name="spark" size={16} />
          <span>{item.price}</span>
        </Button>
      ) : (
        <Button
          size="sm"
          variant={isPlaced ? 'secondary' : 'primary'}
          disabled={isBusy}
          aria-pressed={isPlaced}
          onClick={() =>
            act(
              () => placeGroveItem(item.id, !isPlaced),
              isPlaced ? t('grove.putAwayDone', { name }) : t('grove.placed', { name }),
              isPlaced ? sfx.tap : sfx.place,
            )
          }
        >
          {isPlaced ? t('grove.putAway') : t('grove.place')}
        </Button>
      )}
    </li>
  );
}

/** Decorate the Grove: a live preview on top ("?" for how it works), every piece of decor below, grouped by spot. */
export default function GroveScreen() {
  const { progress } = usePlayer();
  const { t, lang } = useI18n();
  const [message, setMessage] = useState({ text: '', isError: false });

  return (
    <div className={styles.page}>
      <ScreenHeader title={t('grove.decorate')} backHref="#/pals/grove" />
      <main className={styles.main}>
        <div className={styles.preview}>
          <HelpTip title={t('grove.decorate')} className={styles.how}>
            <p>{t('grove.decorateHelp')}</p>
          </HelpTip>
          <GroveScene
            placed={progress.grove.placed}
            partnerId={progress.pal.id}
            owned={progress.pal.owned}
            wearing={progress.pal.wearing}
            worldsFinished={finishedWorldCount(progress.levels)}
          />
        </div>
        <p className={message.isError ? styles.error : styles.status} role={message.isError ? 'alert' : 'status'}>
          {message.text}
        </p>
        {GROVE_SPOTS.map((spot) => (
          <section key={spot.id} className={styles.spot} aria-labelledby={`spot-${spot.id}`}>
            <h2 id={`spot-${spot.id}`} className={`game-title ${styles.spotTitle}`}>
              <span className={styles.spotIcon} aria-hidden="true">
                <GroveItemArt id={ALL_DECOR.find((item) => item.spot === spot.id).id} size={30} />
              </span>
              {spotName(lang, spot)}
            </h2>
            <ul className={styles.items}>
              {ALL_DECOR.filter((item) => item.spot === spot.id && (GROVE_ITEMS.includes(item) || progress.grove.items.includes(item.id))).map(
                (item) => (
                  <DecorItem
                    key={item.id}
                    item={item}
                    onDone={(text) => setMessage({ text, isError: false })}
                    onError={(text) => setMessage({ text, isError: true })}
                  />
                ),
              )}
            </ul>
          </section>
        ))}
      </main>
      <BottomNav active="pals" />
    </div>
  );
}
