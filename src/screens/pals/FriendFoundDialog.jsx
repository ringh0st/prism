import { useEffect, useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { firstFriendFor } from '../../game/firstFriend.js';
import { celebrate } from '../../lib/effects.js';
import { sfx } from '../../audio/sfx.js';
import styles from './FriendFoundDialog.module.css';

/**
 * "You found a friend!": after a few solved levels a Pal turns up as a reward and joins the player.
 * One tap, no decision needed (a different one can be picked any time in Pals).
 */
export default function FriendFoundDialog({ onDone }) {
  const { progress, choosePal } = usePlayer();
  const [friend] = useState(() => firstFriendFor(progress));
  const [isSaving, setIsSaving] = useState(false);

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
    <Dialog title="You found a friend!" tone="celebrate" closesOnBackdrop={false} onClose={welcome}>
      <div className={styles.friend}>
        <PalArt palId={friend.id} size={150} alive label={`${friend.name} the ${friend.species}`} />
      </div>
      <p className={styles.text}>
        <strong>{friend.name}</strong> the {friend.species} wants to join you. It cheers you on while you play!
      </p>
      <Button size="lg" icon="heart" onClick={welcome} disabled={isSaving} data-autofocus>
        Welcome, {friend.name}!
      </Button>
      <p className={styles.note}>You’ll meet more friends as you play. Visit them in Pals.</p>
    </Dialog>
  );
}
