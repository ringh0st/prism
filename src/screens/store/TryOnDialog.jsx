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
      setError(failure.message);
    }
  };

  const useItNow = async () => {
    if (isOutfit) await player.wearAccessory(item.id, true);
    else await player.placeGroveItem(item.id, true);
    sfx.sparkle();
    onClose();
  };

  const title = stage === 'bought' ? 'It’s yours!' : isOutfit ? `Try on: ${item.name}` : `Try out: ${item.name}`;
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
        {isOutfit ? `${palById(partnerId)?.name ?? 'Your Pal'} in the ${item.name.toLowerCase()}` : `Your Grove with the ${item.name.toLowerCase()}`}
        {theme && <span className={styles.themeTag}> · {themeById(theme.theme).name} collection</span>}
      </p>

      {stage === 'bought' ? (
        <div className={styles.actions}>
          <Button size="lg" icon={isOutfit ? 'shirt' : 'home'} onClick={useItNow} data-autofocus>
            {isOutfit ? 'Wear it now' : 'Place it now'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Later
          </Button>
        </div>
      ) : blocker === 'owned' ? (
        <div className={styles.actions}>
          <Button size="lg" icon={isOutfit ? 'shirt' : 'home'} onClick={useItNow} data-autofocus>
            {isOutfit ? 'Wear it' : 'Place it'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Back
          </Button>
        </div>
      ) : (
        <div className={styles.actions}>
          {blocker === null && (
            <Button size="lg" variant="gold" onClick={buy} data-autofocus>
              <Icon name={CURRENCY_ICON[currency]} size={18} />
              <span>Buy for {item.price}</span>
            </Button>
          )}
          {blocker === 'short' && currency === 'sparks' && (
            <>
              <p className={styles.note}>
                You need <strong>{item.price - balance} more sparks</strong>. Play a few levels to earn them!
              </p>
              <Button as="a" href="#/" icon="play" data-autofocus>
                Play
              </Button>
            </>
          )}
          {blocker === 'short' && currency === 'diamonds' && (
            <>
              <p className={styles.note}>
                You need <strong>{item.price - balance} more diamonds</strong>.{' '}
                {isNativeApp
                  ? 'Earn them by finishing worlds and keeping your streak.'
                  : 'Get some in the Diamonds tab, or earn them by finishing worlds.'}
              </p>
              {!isNativeApp && (
                <>
                  <Button icon="diamond" onClick={onGetDiamonds} data-autofocus>
                    Get diamonds
                  </Button>
                  <p className={styles.legal}>Diamonds can be bought with real money. Under 18? Ask a parent first.</p>
                </>
              )}
            </>
          )}
          {blocker === 'signIn' && (
            <>
              <p className={styles.note}>Diamonds need a free account, so they’re always safe.</p>
              <Button as="a" href="#/settings" icon="user" data-autofocus>
                Sign in
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={onClose}>
            Back
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
