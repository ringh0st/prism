import { useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import PalReveal from '../../components/pals/PalReveal.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, isPalUnlocked } from '../../game/pals.js';
import { readJson, writeJson } from '../../lib/storage.js';
import styles from './Pals.module.css';
import { palName, palWithSpecies } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

const SEEN_KEY = 'prism.seenPals.v1';
/** Several new Pals at once show together (a returning player can have many), never one sheet after another. */
const MAX_SHOWN = 6;

/** "New Pal unlocked!" for the Pals a player became able to pick: one at a time is a reveal, several are one group. */
export default function PalUnlockNotice() {
  const { progress } = usePlayer();
  const { t, lang } = useI18n();
  const [seen, setSeen] = useState(() => readJson(SEEN_KEY, []));
  const fresh = progress.pal.id ? PALS.filter((pal) => !progress.pal.owned[pal.id] && !seen.includes(pal.id) && isPalUnlocked(progress, pal)) : [];
  if (!fresh.length) return null;

  const close = () => {
    const next = [...seen, ...fresh.map((pal) => pal.id)];
    writeJson(SEEN_KEY, next);
    setSeen(next);
  };
  const [first] = fresh;
  const isGroup = fresh.length > 1;

  return (
    <Dialog title={isGroup ? t('pals.unlocked.many', { count: fresh.length }) : t('pals.unlocked.title')} tone="celebrate" onClose={close}>
      {isGroup ? (
        <ul className={styles.unlockGroup}>
          {fresh.slice(0, MAX_SHOWN).map((pal, i) => (
            <li key={pal.id} style={{ '--i': i }}>
              <PalArt palId={pal.id} size={72} />
              <span>{palName(lang, pal)}</span>
            </li>
          ))}
          {fresh.length > MAX_SHOWN && (
            <li className={`game-title ${styles.unlockMore}`} dir="ltr">
              +{fresh.length - MAX_SHOWN}
            </li>
          )}
        </ul>
      ) : (
        <>
          <PalReveal key={first.id} pal={first} size={130} />
          <p className={styles.unlockText}>
            <strong>{palWithSpecies(lang, first)}</strong>
            <span className="visually-hidden"> {t('pals.unlocked.wants')}</span>
          </p>
        </>
      )}
      <div className={styles.pickerActions}>
        <Button size="lg" as="a" href="#/pals" onClick={close} data-autofocus>
          {isGroup ? t('pals.unlocked.meetAll') : t('pals.unlocked.meet', { name: palName(lang, first) })}
        </Button>
        <Button variant="ghost" onClick={close}>
          {t('pals.later')}
        </Button>
      </div>
    </Dialog>
  );
}
