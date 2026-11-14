import PalArt from './PalArt.jsx';
import { PAL_STAGES } from '../../game/pals.js';
import styles from './PalFormsStrip.module.css';

/** All five forms of a Pal in a row, Baby to Legend: what it grows into. */
export default function PalFormsStrip({ palId, current = 0 }) {
  return (
    <ol className={styles.strip} aria-label="Forms it grows into">
      {PAL_STAGES.map((stage, index) => (
        <li key={stage.id} className={`${styles.form} ${index === current ? styles.current : ''}`}>
          <PalArt palId={palId} stage={index} size={52} portrait />
          <span>{stage.name}</span>
        </li>
      ))}
    </ol>
  );
}
