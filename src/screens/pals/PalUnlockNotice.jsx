import { useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, isPalUnlocked } from '../../game/pals.js';
import { readJson, writeJson } from '../../lib/storage.js';
import styles from './Pals.module.css';

const SEEN_KEY = 'prism.seenPals.v1';

/** "New Pal unlocked!" once for each Pal a player becomes able to pick. */
export default function PalUnlockNotice() {
  const { progress } = usePlayer();
  const [seen, setSeen] = useState(() => readJson(SEEN_KEY, []));
  if (!progress.pal.id) return null;
  const fresh = PALS.find((pal) => !progress.pal.owned[pal.id] && !seen.includes(pal.id) && isPalUnlocked(progress, pal));
  if (!fresh) return null;

  const close = () => {
    const next = [...seen, fresh.id];
    writeJson(SEEN_KEY, next);
    setSeen(next);
  };

  return (
    <Dialog title="New Pal unlocked!" tone="celebrate" onClose={close}>
      <PalArt palId={fresh.id} size={130} className={styles.unlockArt} />
      <p className={styles.unlockText}>
        <strong>
          {fresh.name} the {fresh.species}
        </strong>{' '}
        wants to join your team.
      </p>
      <div className={styles.pickerActions}>
        <Button
          size="lg"
          as="a"
          href="#/settings"
          onClick={close}
          data-autofocus
        >
          Meet {fresh.name}
        </Button>
        <Button variant="ghost" onClick={close}>
          Later
        </Button>
      </div>
    </Dialog>
  );
}
