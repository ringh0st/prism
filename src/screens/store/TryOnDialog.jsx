import { useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import GroveScene from '../../components/grove/GroveScene.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { accessoryById, stageOf } from '../../game/pals.js';
import { groveItemById } from '../../game/grove.js';
import { themeById, themeItemBlocker, themeItemById } from '../../game/themes.js';
import { isNativeApp } from '../../lib/platform.js';
import { rewardShower } from '../../lib/effects.js';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { shopItemName, themeText } from '../../i18n/shopText.js';
import { errorText } from '../../i18n/meText.js';
import AskParent from './AskParent.jsx';
import SignInNote from './SignInNote.jsx';
import styles from './TryOnDialog.module.css';

const CURRENCY_ICON = { sparks: 'spark', diamonds: 'diamond' };

/**
 * "Try it on" before buying: your own partner wearing the outfit piece (or your Grove with the decor in
 * place). Then buy it (and wear or place it right away), or see what's missing: sparks come from
 * playing; diamonds from the Diamonds tab (ask a parent) or by finishing worlds in the app.
 * @param item       an outfit piece or decoration (regular or from this week's theme)
 * @param onGetDiamonds switches the Shop to its Diamonds tab
 */
export default function TryOnDialog({ item, onClose, onGetDiamonds }) {
  const player = usePlayer();
  const { t, lang } = useI18n();
  const { progress, isSignedIn } = player;
  const [stage, setStage] = useState('preview');
  const [error, setError] = useState('');
  const isOutfit = Boolean(accessoryById(item.id));
  const theme = themeItemById(item.id);
  const currency = item.currency ?? 'sparks';
  const blocker = themeItemBlocker(progress, { ...item, kind: isOutfit ? 'outfit' : 'decor', currency }, { isSignedIn });
  const balance = currency === 'diamonds' ? progress.diamonds : progress.sparks;

  // The preview: swap the item into its slot or spot.
  const partnerId = progress.pal.id ?? 'ember';
  const wearing = [...progress.pal.wearing.filter((id) => accessoryById(id)?.slot !== item.slot), ...(isOutfit ? [item.id] : [])];
  const placed = isOutfit ? progress.grove.placed : [...progress.grove.placed.filter((id) => groveItemById(id)?.spot !== item.spot), item.id];

  const buy = async () => {
    setError('');
    try {
      if (theme) await player.buyThemeItem(item.id);
      else if (isOutfit) await player.buyAccessory(item.id);
      else await player.buyGroveItem(item.id);
      sfx.coin();
      rewardShower();
      setStage('bought');
    } catch (failure) {
      setError(errorText(t, failure.message));
    }
  };

  const useItNow = async () => {
    if (isOutfit) await player.wearAccessory(item.id, true);
    else await player.placeGroveItem(item.id, true);
    sfx.sparkle();
    onClose();
  };

  const name = shopItemName(lang, item);
  const title = stage === 'bought' ? t('shop.tryOn.yours') : t(isOutfit ? 'shop.tryOn.titleOutfit' : 'shop.tryOn.titleDecor', { name });
  return (
    <Dialog title={title} tone="celebrate" onClose={onClose}>
      <div className={styles.preview}>
        {isOutfit ? (
          <div className={styles.stage}>
            <PalArt palId={partnerId} stage={stageOf(progress.pal.owned[partnerId])} wearing={wearing} size="100%" alive />
          </div>
        ) : (
          <GroveScene placed={placed} partnerId={progress.pal.id} owned={{}} wearing={progress.pal.wearing} worldsFinished={0} />
        )}
      </div>
      {theme && (
        <p className={styles.themeTag}>
          <span aria-hidden="true">{themeById(theme.theme).icon}</span> {themeText(lang, themeById(theme.theme)).name}
        </p>
      )}

      {stage === 'bought' ? (
        <div className={styles.actions}>
          <Button size="lg" icon={isOutfit ? 'shirt' : 'home'} onClick={useItNow} data-autofocus>
            {t(isOutfit ? 'shop.tryOn.wearNow' : 'shop.tryOn.placeNow')}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t('shop.tryOn.later')}
          </Button>
        </div>
      ) : blocker === 'owned' ? (
        <div className={styles.actions}>
          <Button size="lg" icon={isOutfit ? 'shirt' : 'home'} onClick={useItNow} data-autofocus>
            {t(isOutfit ? 'shop.tryOn.wear' : 'shop.tryOn.place')}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t('shop.tryOn.back')}
          </Button>
        </div>
      ) : (
        <div className={styles.actions}>
          {blocker === null && (
            <Button size="lg" variant="gold" onClick={buy} data-autofocus>
              <Icon name={CURRENCY_ICON[currency]} size={18} />
              <span>{t('shop.tryOn.buyFor', { price: item.price })}</span>
            </Button>
          )}
          {blocker === 'short' && (
            <p className={styles.short}>
              <span aria-hidden="true">
                <Icon name={CURRENCY_ICON[currency]} size={20} /> {t('shop.tryOn.need', { count: item.price - balance })}
              </span>
              <span className="visually-hidden">
                {t(currency === 'diamonds' ? 'shop.tryOn.moreDiamonds' : 'shop.tryOn.moreSparks', { count: item.price - balance })}
              </span>
            </p>
          )}
          {blocker === 'short' && currency === 'sparks' && (
            <Button as="a" href="#/" icon="play" data-autofocus>
              {t('shop.tryOn.play')}
            </Button>
          )}
          {blocker === 'short' && currency === 'diamonds' && isNativeApp && <p className={styles.note}>{t('shop.tryOn.earnDiamondsApp')}</p>}
          {blocker === 'short' && currency === 'diamonds' && !isNativeApp && (
            <>
              <Button icon="diamond" onClick={onGetDiamonds} data-autofocus>
                {t('shop.tryOn.getDiamonds')}
              </Button>
              <AskParent />
            </>
          )}
          {blocker === 'signIn' && <SignInNote />}
          <Button variant="secondary" onClick={onClose}>
            {t('shop.tryOn.back')}
          </Button>
        </div>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </Dialog>
  );
}
