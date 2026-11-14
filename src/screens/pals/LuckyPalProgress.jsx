import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { LUCKY_PAL_EVERY, LUCKY_PAL_ODDS, solvedLevelCount } from '../../game/pals.js';
import styles from './LuckyPal.module.css';

const percent = (share) => `${Math.round(share * 100)}%`;

/** How close the next Lucky Pal gift is, and its odds (free gifts still show their odds). */
export default function LuckyPalProgress() {
  const { progress } = usePlayer();
  const toward = solvedLevelCount(progress.levels) % LUCKY_PAL_EVERY;
  return (
    <section className={styles.card} aria-labelledby="lucky-title">
      <span className={styles.icon} aria-hidden="true">
        <Icon name="gift" size={26} />
      </span>
      <div className={styles.body}>
        <h2 id="lucky-title" className="game-title">
          Lucky Pal gift
        </h2>
        <p className={styles.line}>
          A free new Pal every {LUCKY_PAL_EVERY} levels: {LUCKY_PAL_EVERY - toward} to go!
        </p>
        <div
          className={styles.track}
          role="progressbar"
          aria-label="Progress to the next Lucky Pal gift"
          aria-valuemin={0}
          aria-valuemax={LUCKY_PAL_EVERY}
          aria-valuenow={toward}
        >
          <span className={styles.fill} style={{ width: `${(toward / LUCKY_PAL_EVERY) * 100}%` }} />
        </div>
        <p className={styles.odds}>
          Chances: Pal {percent(LUCKY_PAL_ODDS.common)} · ★ Legendary {percent(LUCKY_PAL_ODDS.legendary)} · ✦ Mythic{' '}
          {percent(LUCKY_PAL_ODDS.mythic)}. Always one you don’t have yet.
        </p>
      </div>
    </section>
  );
}
