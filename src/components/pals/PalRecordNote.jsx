import { useEffect } from 'react';
import Icon from '../Icon.jsx';
import PalArt from './PalArt.jsx';
import { recordIcon } from '../../game/palRecords.js';
import { sfx } from '../../audio/sfx.js';
import { palName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './PalRecordNote.module.css';

const SHOW_AFTER_MS = 2600;

/** On the win screen: a medal just earned together with the partner Pal (the Pal, the shining medal, one short line). */
export default function PalRecordNote({ partner, records }) {
  const { t, lang } = useI18n();
  useEffect(() => {
    const timer = setTimeout(() => sfx.levelUp(), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);
  return (
    <a
      href="#/pals"
      className={styles.note}
      aria-label={records.map((id) => `${t('records.new', { name: palName(lang, partner) })} ${t(`records.${id}.name`)}`).join('. ')}
    >
      <PalArt palId={partner.id} size={44} />
      {records.map((id) => (
        <span key={id} className={styles.medal} aria-hidden="true">
          <Icon name={recordIcon(id)} size={22} />
        </span>
      ))}
      <span className={`game-title ${styles.word}`} aria-hidden="true">
        {t(`records.${records[0]}.name`)}
      </span>
    </a>
  );
}
