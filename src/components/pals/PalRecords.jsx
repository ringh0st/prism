import { useState } from 'react';
import Icon from '../Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { palRecordsFor } from '../../game/palRecords.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './PalRecords.module.css';

/**
 * A Pal's records as a row of medals: each fills a ring as it gets closer and shines when done. Words only
 * on tap (the selected medal says what it's for), so it reads at a glance.
 */
export default function PalRecords({ palId }) {
  const { progress } = usePlayer();
  const { t } = useI18n();
  const records = palRecordsFor(progress, palId);
  const [selected, setSelected] = useState(null);
  const shown = records.find((record) => record.id === selected);
  return (
    <section className={styles.records} aria-label={t('records.title')}>
      <ul className={styles.medals}>
        {records.map((record) => (
          <li key={record.id}>
            <button
              type="button"
              className={`${styles.medal} ${record.isDone ? styles.done : ''} ${selected === record.id ? styles.selected : ''}`}
              style={{ '--fill': `${(record.have / record.goal) * 360}deg` }}
              onClick={() => setSelected(selected === record.id ? null : record.id)}
              aria-pressed={selected === record.id}
              aria-label={`${t(`records.${record.id}.name`)}: ${t(`records.${record.id}.how`, { count: record.goal })} ${record.have}/${record.goal}`}
            >
              <span className={styles.face}>
                <Icon name={record.icon} size={22} />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {shown && (
        <p className={styles.how} role="status">
          <strong>{t(`records.${shown.id}.name`)}</strong> · {t(`records.${shown.id}.how`, { count: shown.goal })} ({shown.have}/{shown.goal})
        </p>
      )}
    </section>
  );
}
