import { CREATURES } from './creatureArt.jsx';
import styles from './BackdropCreature.module.css';

/** How high each way of moving travels: on the ground in front of the hills, or up in the sky. */
const GROUND_MOVES = new Set(['walk', 'crawl', 'hop', 'roll', 'dart', 'paddle', 'peck']);

/**
 * One little animal in a level's landscape, getting around in its own way: a camel plods, a lizard
 * darts and freezes, a tumbleweed rolls, a hawk circles, a fennec peeks over the dune. Purely decorative.
 * @param plan { id, lane (0–1), delay (s), duration (s), isReversed, x (% for animals that stay put), scale }
 */
export default function BackdropCreature({ plan }) {
  const creature = CREATURES[plan.id];
  const scale = plan.scale ?? 1;
  const art = (
    <svg
      className={styles.art}
      width={creature.width * scale}
      height={creature.height * scale}
      viewBox={`0 0 ${creature.width} ${creature.height}`}
      focusable="false"
    >
      {creature.art}
    </svg>
  );
  const timing = { animationDelay: `${plan.delay}s`, animationDuration: `${plan.duration}s` };

  if (creature.move === 'peek' || creature.move === 'soar') {
    return (
      <span className={`${styles.stay} ${styles[creature.move]}`} style={{ left: `${plan.x}%`, bottom: creature.move === 'soar' ? '86%' : '47%' }}>
        <span className={styles.body} style={timing}>
          {art}
        </span>
      </span>
    );
  }

  const isGround = GROUND_MOVES.has(creature.move);
  const bottom = isGround ? 44 + plan.lane * 8 : 72 + plan.lane * 22;
  return (
    <span
      className={`${styles.traveler} ${styles[creature.move]} ${plan.isReversed ? styles.reversed : ''}`}
      style={{ bottom: `${bottom}%`, zIndex: isGround ? 2 : 1, ...timing }}
    >
      <span className={styles.body}>{art}</span>
    </span>
  );
}
