import { useEffect, useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, isPalUnlocked } from '../../game/pals.js';
import { readJson, writeJson } from '../../lib/storage.js';
import { sfx } from '../../audio/sfx.js';
import styles from './Pals.module.css';
import { palName, palWithSpecies } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

const SEEN_KEY = 'prism.seenPals.v1';

/** "New Pal unlocked!" once for each Pal a player becomes able to pick. */
export default function PalUnlockNotice() {
  const { progress } = usePlayer();
  const { t, lang } = useI18n();
  const [seen, setSeen] = useState(() => readJson(SEEN_KEY, []));
  const fresh = progress.pal.id ? PALS.find((pal) => !progress.pal.owned[pal.id] && !seen.includes(pal.id) && isPalUnlocked(progress, pal)) : null;
  // A little fanfare once for each new Pal.
  const freshId = fresh?.id;
  useEffect(() => {
    if (freshId) sfx.newPal();
  }, [freshId]);
  if (!fresh) return null;

  const close = () => {
    const next = [...seen, fresh.id];
    writeJson(SEEN_KEY, next);
    setSeen(next);
  };

  return (
    <Dialog title={t('pals.unlocked.title')} tone="celebrate" onClose={close}>
      <PalArt palId={fresh.id} size={130} alive className={styles.unlockArt} />
      <p className={styles.unlockText}>
        <strong>{palWithSpecies(lang, fresh)}</strong> {t('pals.unlocked.wants')}
      </p>
      <div className={styles.pickerActions}>
        <Button size="lg" as="a" href="#/pals" onClick={close} data-autofocus>
          {t('pals.unlocked.meet', { name: palName(lang, fresh) })}
        </Button>
        <Button variant="ghost" onClick={close}>
          {t('pals.later')}
        </Button>
      </div>
    </Dialog>
  );
}
