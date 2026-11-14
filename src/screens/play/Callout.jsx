import styles from './Callout.module.css';

/**
 * A short cheer ("Sparkly!", "Last move!") that pops over the board and fades by itself, like a game shout,
 * instead of text to read in Lumi's box.
 */
export default function Callout({ callout }) {
  return (
    <div key={callout.key} className={`${styles.callout} ${callout.isBig ? styles.big : ''}`} role="status">
      <span className="game-title">{callout.text}</span>
    </div>
  );
}
