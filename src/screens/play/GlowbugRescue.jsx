import GlowbugArt from '../../components/glowbugs/GlowbugArt.jsx';
import { glowbugById } from '../../game/glowbugs.js';
import styles from './GlowbugRescue.module.css';

/** On the win screen: the level's Glowbug, rescued (three stars) or still shy. */
export default function GlowbugRescue({ glowbug }) {
  const bug = glowbugById(glowbug.id);
  if (!glowbug.isRescued) {
    return (
      <p className={`${styles.rescue} ${styles.shy}`}>
        <GlowbugArt id={bug.id} size={48} isAwake={false} />
        <span>
          <strong>{bug.name}</strong> is still a bit shy… Get ★★★ to rescue it!
        </span>
      </p>
    );
  }
  return (
    <div className={styles.rescue} role="status">
      <span className={styles.art}>
        <GlowbugArt id={bug.id} size={64} />
      </span>
      <span>
        {glowbug.isNew && <span className={styles.new}>New!</span>}
        <strong>You rescued {bug.name}!</strong> <span className={styles.kind}>({bug.title})</span>
        <span className={styles.bio}>{bug.bio}</span>
        <a href="#/glowbugs" className={styles.link}>
          Visit your Glowbug Garden
        </a>
      </span>
    </div>
  );
}
