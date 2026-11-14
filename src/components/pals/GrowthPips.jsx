import { PAL_STAGES } from '../../game/pals.js';
import styles from './PalCard.module.css';

/** One icon per form, from a little sprout to a crown (16×16). */
const FORM_ICONS = {
  baby: 'M7.2 15V9h1.6v6zM8 9C8 6 6 4 3 4c0 3 2 5 5 5zm0-1c0-3 2-5 5-5 0 3-2 5-5 5z',
  junior: 'M2.5 13.5C2.5 7.5 7 2.5 13.5 2.5c0 6.5-5 11-11 11zm1.3-.6l6-6-.7-.7-6 6z',
  buddy:
    'M8 1.4a2.6 2.6 0 0 1 2.6 2.6 2.6 2.6 0 0 1 3.2 3.7 2.6 2.6 0 0 1-1.6 4.6 2.6 2.6 0 0 1-4.2 1.4 2.6 2.6 0 0 1-4.2-1.4A2.6 2.6 0 0 1 2.2 7.7 2.6 2.6 0 0 1 5.4 4 2.6 2.6 0 0 1 8 1.4zm0 4.6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  champ: 'M8 1a5 5 0 0 1 5 5 4 4 0 0 1-2 7H9v2.5H7V13H5a4 4 0 0 1-2-7 5 5 0 0 1 5-5z',
  legend: 'M1.5 5l3.3 3L8 2.5 11.2 8l3.3-3-1.6 7.5H3.1zM3 13.6h10V15H3z',
};

/** The five forms as icons, lit up to the Pal's form: a growth meter you can read by shape, not just color. */
export default function GrowthPips({ stageIndex }) {
  return (
    <span className={styles.pips} aria-hidden="true">
      {PAL_STAGES.map((stage, i) => (
        <svg key={stage.id} viewBox="0 0 16 16" className={i <= stageIndex ? styles.pipOn : styles.pip}>
          <path d={FORM_ICONS[stage.id]} fillRule="evenodd" />
        </svg>
      ))}
    </span>
  );
}
