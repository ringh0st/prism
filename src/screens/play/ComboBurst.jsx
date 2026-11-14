import styles from './ComboBurst.module.css';

/** "Double!", "Triple!" or "MEGA!" bursting over the board when one tap lights several gems. */
export default function ComboBurst({ combo }) {
  return (
    <div key={combo.key} className={`${styles.burst} ${combo.size >= 4 ? styles.mega : ''}`} role="status">
      <span className={`game-title ${styles.word}`}>{combo.word}</span>
      <span className={styles.detail}>{combo.size} gems in one move</span>
    </div>
  );
}
