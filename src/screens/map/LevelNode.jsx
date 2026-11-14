import Icon from '../../components/Icon.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import { DIFFICULTY } from '../../game/constants.js';
import { MAX_STARS } from '../../game/scoring.js';
import styles from './Map.module.css';

const DIFFICULTY_LABEL = { [DIFFICULTY.HARD]: 'hard', [DIFFICULTY.EXTRA]: 'boss' };

/** One level bubble on the map. */
export default function LevelNode({ stop, stars, isUnlocked, isCurrent, greeting = null, nodeRef }) {
  const { ref, x, y } = stop;
  const kindLabel = DIFFICULTY_LABEL[ref.difficulty];
  const label = `Level ${ref.world}-${ref.index}${kindLabel ? `, ${kindLabel}` : ''}, ${isUnlocked ? `${stars} of ${MAX_STARS} stars` : 'locked'}`;
  const className = `${styles.node} ${styles[ref.difficulty]} ${isUnlocked ? '' : styles.lockedNode} ${isCurrent ? styles.currentNode : ''} ${
    stars > 0 ? styles.doneNode : ''
  }`;
  const content = (
    <>
      {isUnlocked && stars > 0 && (
        <span className={styles.nodeStars} aria-hidden="true">
          {Array.from({ length: MAX_STARS }, (_, i) => (
            <Icon key={i} name="star" size={16} className={i < stars ? styles.starOn : styles.starOff} />
          ))}
        </span>
      )}
      <span className={styles.nodeFace}>
        {isUnlocked ? <span className={`game-title ${styles.nodeNumber}`}>{ref.index}</span> : <Icon name="lock" size={22} strokeWidth={2.8} />}
      </span>
      {ref.difficulty === DIFFICULTY.HARD && (
        <span className={styles.flame} aria-hidden="true">
          <Icon name="flame" size={16} />
        </span>
      )}
      {ref.difficulty === DIFFICULTY.EXTRA && (
        <span className={styles.crown} aria-hidden="true">
          <Icon name="crown" size={22} />
        </span>
      )}
      {ref.difficulty === DIFFICULTY.EXTRA && <span className={`game-title on-color ${styles.bossPlate}`}>BOSS</span>}
      {isCurrent && (
        <span className={`${styles.lumiOnNode} ${x > 50 ? styles.lumiLeft : styles.lumiRight}`} aria-hidden="true">
          <Lumi mood="excited" size={80} line={greeting} bubbleSide="top" />
        </span>
      )}
    </>
  );

  const style = { left: `${x}%`, top: `${y}px` };
  return isUnlocked ? (
    <a ref={nodeRef} href={`#/play/${ref.id}`} className={className} style={style} aria-label={label}>
      {content}
    </a>
  ) : (
    <span className={className} style={style} role="img" aria-label={label}>
      {content}
    </span>
  );
}
