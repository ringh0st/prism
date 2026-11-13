import Icon from '../../components/Icon.jsx';
import styles from './Map.module.css';

/** A reward chest on the map: locked, ready to open (glowing), or already opened. */
export default function ChestNode({ stop, state, onOpen }) {
  const style = { left: `${stop.x}%`, top: `${stop.y}px` };
  const label = {
    locked: `Reward chest. Finish ${stop.levelsNeeded} levels to open it.`,
    ready: 'Reward chest ready! Tap to open.',
    opened: 'Reward chest, already opened.',
  }[state];
  return (
    <button
      type="button"
      className={`${styles.chest} ${styles[`chest_${state}`]}`}
      style={style}
      onClick={state === 'ready' ? onOpen : undefined}
      aria-disabled={state !== 'ready'}
      aria-label={label}
    >
      <Icon name="chest" size={36} />
      {state === 'ready' && <span className={`game-title ${styles.chestTag}`}>Open!</span>}
    </button>
  );
}
