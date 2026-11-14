import { useEffect, useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { firstFriendFor } from '../../game/firstFriend.js';
import { celebrate } from '../../lib/effects.js';
import { sfx } from '../../audio/sfx.js';
import styles from './FriendFoundDialog.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { palName } from '../../i18n/palText.js';

/**
 * "You found a friend!": after a few solved levels a Pal turns up as a reward and joins the player.
 * One tap, no decision needed (a different one can be picked any time in Pals).
 */
export default function FriendFoundDialog({ onDone }) {
  const { progress, choosePal } = usePlayer();
  const [friend] = useState(() => firstFriendFor(progress));
  const [isSaving, setIsSaving] = useState(false);
  const { t, lang } = useI18n();

  useEffect(() => {
    sfx.newPal();
    celebrate({ stars: 3, isBig: true });
  }, []);

  const welcome = async () => {
    setIsSaving(true);
    try {
      await choosePal(friend.id);
    } catch {
      // Saving can be retried later from the Pals screen; carry on playing either way.
    }
    onDone();
  };

  return (
    <Dialog title={t('friend.title')} tone="celebrate" closesOnBackdrop={false} onClose={welcome}>
      <div className={styles.friend}>
        <PalArt palId={friend.id} size={150} alive label={palName(lang, friend)} />
      </div>
      <p className={styles.text}>{t('friend.text', { name: palName(lang, friend) })}</p>
      <Button size="lg" icon="heart" onClick={welcome} disabled={isSaving} data-autofocus>
        {t('friend.welcome', { name: palName(lang, friend) })}
      </Button>
      <p className={styles.note}>{t('friend.note')}</p>
    </Dialog>
  );
}
