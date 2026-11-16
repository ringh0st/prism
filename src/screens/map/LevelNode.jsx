import { levelNumber } from '../../game/worlds.js';
import Icon from '../../components/Icon.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import { DIFFICULTY } from '../../game/constants.js';
import { MAX_STARS } from '../../game/scoring.js';
import { sfx } from '../../audio/sfx.js';
import styles from './Map.module.css';
import GlowbugArt from '../../components/glowbugs/GlowbugArt.jsx';
import { glowbugForLevel } from '../../game/glowbugs.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

const DIFFICULTY_LABEL = { [DIFFICULTY.HARD]: 'map.node.hard', [DIFFICULTY.EXTRA]: 'map.node.boss' };

/** One level bubble on the map; `isBonusDone` adds a small mint tick for a level whose bonus goal was met. */
export default function LevelNode({ stop, stars, isUnlocked, isCurrent, isBonusDone = false, nodeRef }) {
  const { t } = useI18n();
  // A Glowbug still waiting to be rescued here (three stars frees it).
  const glowbug = isUnlocked && stars < 3 ? glowbugForLevel(stop.ref.id) : null;
  const { ref, x, y } = stop;
  const kindLabel = DIFFICULTY_LABEL[ref.difficulty];
  const label = [
    t('level.title', { label: levelNumber(ref.world, ref.index) }),
    kindLabel && t(kindLabel),
    isUnlocked ? t('map.node.stars', { count: stars, max: MAX_STARS }) : t('map.node.locked'),
    glowbug && t('map.node.glowbug'),
    isBonusDone && t('map.node.bonus'),
  ]
    .filter(Boolean)
    .join(', ');
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
        {isUnlocked ? (
          <span className={`game-title ${styles.nodeNumber}`} data-digits={String(levelNumber(ref.world, ref.index)).length}>
            {levelNumber(ref.world, ref.index)}
          </span>
        ) : (
          <Icon name="lock" size={22} strokeWidth={2.8} />
        )}
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
      {ref.difficulty === DIFFICULTY.EXTRA && <span className={`game-title on-color ${styles.bossPlate}`}>{t('map.boss')}</span>}
      {isBonusDone && (
        <span className={styles.bonusPip} aria-hidden="true">
          <Icon name="check" size={12} strokeWidth={3.6} />
        </span>
      )}
      {glowbug && (
        <span className={styles.glowbugBadge} aria-hidden="true">
          <GlowbugArt id={glowbug.id} size={30} isAwake={false} />
        </span>
      )}
      {isCurrent && (
        <span className={`${styles.lumiOnNode} ${x > 50 ? styles.lumiLeft : styles.lumiRight}`} aria-hidden="true">
          <Lumi mood="excited" size={80} />
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
    <span className={className} style={style} role="img" aria-label={label} onClick={() => sfx.locked()}>
      {content}
    </span>
  );
}
