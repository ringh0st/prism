import { useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import GroveScene from '../../components/grove/GroveScene.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { accessoryById, palById, stageOf } from '../../game/pals.js';
import { groveItemById } from '../../game/grove.js';
import { themeById, themeItemBlocker, themeItemById } from '../../game/themes.js';
import { isNativeApp } from '../../lib/platform.js';
import { rewardShower } from '../../lib/effects.js';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { shopItemName, themeText } from '../../i18n/shopText.js';
import { palName } from '../../i18n/palText.js';
import styles from './TryOnDialog.module.css';
import { errorText } from '../../i18n/meText.js';

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
  const partner = palById(partnerId);
  const partnerName = partner ? palName(lang, partner) : t('shop.tryOn.yourPal');
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
      <p className={styles.caption}>
        {isOutfit
          ? t('shop.tryOn.captionOutfit', { pal: partnerName, item: name.toLowerCase() })
          : t('shop.tryOn.captionDecor', { item: name.toLowerCase() })}
        {theme && <span className={styles.themeTag}> · {t('shop.tryOn.collection', { theme: themeText(lang, themeById(theme.theme)).name })}</span>}
      </p>

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
          {blocker === 'short' && currency === 'sparks' && (
            <>
              <p className={styles.note}>
                {t('shop.tryOn.youNeed')} <strong>{t('shop.tryOn.moreSparks', { count: item.price - balance })}</strong>. {t('shop.tryOn.earnSparks')}
              </p>
              <Button as="a" href="#/" icon="play" data-autofocus>
                {t('shop.tryOn.play')}
              </Button>
            </>
          )}
          {blocker === 'short' && currency === 'diamonds' && (
            <>
              <p className={styles.note}>
                {t('shop.tryOn.youNeed')} <strong>{t('shop.tryOn.moreDiamonds', { count: item.price - balance })}</strong>.{' '}
                {t(isNativeApp ? 'shop.tryOn.earnDiamondsApp' : 'shop.tryOn.earnDiamondsWeb')}
              </p>
              {!isNativeApp && (
                <>
                  <Button icon="diamond" onClick={onGetDiamonds} data-autofocus>
                    {t('shop.tryOn.getDiamonds')}
                  </Button>
                  <p className={styles.legal}>{t('shop.askParent')}</p>
                </>
              )}
            </>
          )}
          {blocker === 'signIn' && (
            <>
              <p className={styles.note}>{t('shop.tryOn.needAccount')}</p>
              <Button as="a" href="#/settings" icon="user" data-autofocus>
                {t('shop.tryOn.signIn')}
              </Button>
            </>
          )}
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
