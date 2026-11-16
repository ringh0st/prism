import { useEffect, useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Icon from '../../components/Icon.jsx';
import Button from '../../components/Button.jsx';
import PalReveal from '../../components/pals/PalReveal.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { firstFriendFor } from '../../game/firstFriend.js';
import { palPower } from '../../game/palPowers.js';
import { celebrate } from '../../lib/effects.js';
import styles from './FriendFoundDialog.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { palName } from '../../i18n/palText.js';

/**
 * "You found a friend!": after a few solved levels a Pal turns up as a reward and joins the player.
 * One tap, no decision needed (a different one can be picked any time in Pals). Below the Pal, three
 * picture rows say what it does (its power in levels first) (playtesters loved the Pals but didn't know what they were for).
 */
export default function FriendFoundDialog({ onDone }) {
  const { progress, choosePal } = usePlayer();
  const [friend] = useState(() => firstFriendFor(progress));
  const [isSaving, setIsSaving] = useState(false);
  const { t, lang } = useI18n();
  // What it does, most useful first: its power in levels, presents, and growing (stronger) as you play.
  const power = palPower(friend, 0);
  const does = [
    { icon: power.icon, text: t(`power.${power.id}.line`, { count: power.amount }) },
    { icon: 'gift', text: t('friend.does.gifts') },
    { icon: 'spark', text: t('friend.does.grows') },
  ];

  // The Pal itself appears with its own reveal; the confetti follows as it pops out.
  useEffect(() => {
    const timer = setTimeout(() => celebrate({ stars: 3, isBig: true }), 1350);
    return () => clearTimeout(timer);
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
        <PalReveal pal={friend} size={150} label={palName(lang, friend)} />
      </div>
      <p className="visually-hidden">{t('friend.text', { name: palName(lang, friend) })}</p>
      <ul className={styles.does}>
        {does.map(({ icon, text }) => (
          <li key={icon}>
            <span className={styles.doesIcon} aria-hidden="true">
              <Icon name={icon} size={22} />
            </span>
            {text}
          </li>
        ))}
      </ul>
      <Button size="lg" icon="heart" onClick={welcome} disabled={isSaving} data-autofocus>
        {t('friend.welcome', { name: palName(lang, friend) })}
      </Button>
      <p className="visually-hidden">{t('friend.note')}</p>
    </Dialog>
  );
}
