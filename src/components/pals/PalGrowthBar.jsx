import { PAL_GROWTH_LEVELS, growthOf, palStage, stageOf } from '../../game/pals.js';
import styles from './PalGrowthBar.module.css';

/** What the bar is filling toward, in words. */
function growthLine(pal, stage, left) {
  if (!stage.next) return `${pal.name} is fully grown: a true Legend!`;
  return `${left} more ${left === 1 ? 'level' : 'levels'} to grow ${pal.name} into a ${stage.next.name}.`;
}

/** How close a Pal is to its next form: it grows by one for every level solved while it's your partner. */
export default function PalGrowthBar({ pal, owned, showLine = true }) {
  const stage = palStage(stageOf(owned));
  const growth = stage.next ? growthOf(owned) : PAL_GROWTH_LEVELS;
  const percent = Math.round((growth / PAL_GROWTH_LEVELS) * 100);
  return (
    <div className={styles.box}>
      <div className={styles.head}>
        <span>{stage.next ? `Next: ${stage.next.name}` : 'Legend'}</span>
        <span className={styles.count}>
          {growth}/{PAL_GROWTH_LEVELS}
        </span>
      </div>
      <div
        className={`${styles.track} ${stage.next ? '' : styles.full}`}
        role="progressbar"
        aria-label={stage.next ? `${pal.name}'s growth to ${stage.next.name}` : `${pal.name} is fully grown`}
        aria-valuemin={0}
        aria-valuemax={PAL_GROWTH_LEVELS}
        aria-valuenow={growth}
        aria-valuetext={`${growth} of ${PAL_GROWTH_LEVELS} levels`}
      >
        <span className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      {showLine && <p className={styles.line}>{growthLine(pal, stage, PAL_GROWTH_LEVELS - growth)}</p>}
    </div>
  );
}
