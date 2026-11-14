import GlowbugArt from '../../components/glowbugs/GlowbugArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { GLOWBUGS, rescuedGlowbugs } from '../../game/glowbugs.js';
import styles from './GlowbugGardenLink.module.css';

/** The way into the Glowbug Garden from the Pals screen, with how many you've found. */
export default function GlowbugGardenLink() {
  const { progress } = usePlayer();
  const rescued = rescuedGlowbugs(progress.levels);
  const latest = GLOWBUGS.filter((bug) => rescued.has(bug.id)).slice(-3);
  return (
    <a href="#/glowbugs" className={styles.link}>
      <span className={styles.bugs} aria-hidden="true">
        {(latest.length ? latest : GLOWBUGS.slice(0, 1)).map((bug) => (
          <GlowbugArt key={bug.id} id={bug.id} size={40} isAwake={latest.length > 0} />
        ))}
      </span>
      <span className={styles.text}>
        <strong className="game-title">Glowbug Garden</strong>
        <span>
          {rescued.size} of {GLOWBUGS.length} found
        </span>
      </span>
      <span className={styles.go} aria-hidden="true">
        ›
      </span>
    </a>
  );
}
