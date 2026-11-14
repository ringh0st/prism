import PalArt from './PalArt.jsx';
import Icon from '../Icon.jsx';
import { PAL_STAGES } from '../../game/pals.js';
import stageStyles from './PalStage.module.css';
import styles from './PalFormsStrip.module.css';

/**
 * All five forms of a Pal in a row, Baby to Master. Forms after `revealedUpTo` are mystery silhouettes
 * (with a lock, so it's not color alone). With `onSelect`, each form is a button to look at it.
 */
export default function PalFormsStrip({ palId, current = 0, revealedUpTo = PAL_STAGES.length - 1, selected = null, onSelect = null }) {
  return (
    <ol className={styles.strip} aria-label="Forms it grows into">
      {PAL_STAGES.map((stage, index) => {
        const isHidden = index > revealedUpTo;
        const name = isHidden ? '???' : stage.name;
        const content = (
          <>
            <span className={`${styles.art} ${isHidden ? '' : `${stageStyles.backdrop} ${stageStyles[stage.id]}`}`}>
              <PalArt palId={palId} stage={index} size={52} portrait className={isHidden ? styles.silhouette : ''} />
              {isHidden && <Icon name="lock" size={14} className={styles.lock} />}
            </span>
            <span>{name}</span>
          </>
        );
        const className = `${styles.form} ${index === current ? styles.current : ''} ${index === selected ? styles.selected : ''}`;
        return (
          <li key={stage.id}>
            {onSelect ? (
              <button
                type="button"
                className={className}
                onClick={() => onSelect(index)}
                aria-pressed={index === selected}
                aria-label={`${isHidden ? 'Future form, still a mystery' : stage.name}${index === current ? ' (now)' : ''}`}
              >
                {content}
              </button>
            ) : (
              <div className={className}>{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
