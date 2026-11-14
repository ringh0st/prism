import { useState } from 'react';
import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import GlowbugArt from '../../components/glowbugs/GlowbugArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { GLOWBUGS, rescuedGlowbugs } from '../../game/glowbugs.js';
import styles from './GlowbugGarden.module.css';

/**
 * The Glowbug Garden: every Glowbug you've rescued (by three-starring the level it napped on), with the
 * ones still out there as gentle silhouettes. Tap a rescued one to meet it.
 */
export default function GlowbugGarden() {
  const { progress } = usePlayer();
  const [meeting, setMeeting] = useState(null);
  const rescued = rescuedGlowbugs(progress.levels);
  const found = GLOWBUGS.filter((bug) => rescued.has(bug.id)).length;

  return (
    <div className={styles.page}>
      <ScreenHeader title="Glowbug Garden" backHref="#/pals/team" />
      <main className={styles.main}>
        <section className={styles.intro}>
          <p className={styles.count}>
            <strong className="game-title">{found}</strong> of {GLOWBUGS.length} Glowbugs found
          </p>
          <div
            className={styles.meter}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={GLOWBUGS.length}
            aria-valuenow={found}
            aria-label="Glowbugs found"
          >
            <span style={{ width: `${(found / GLOWBUGS.length) * 100}%` }} />
          </div>
          <p className={styles.how}>
            Glowbugs nap on some levels (look for them on the map). Get ★★★ there to rescue them. The rare ones hide in Hard and boss levels.
          </p>
        </section>
        <ul className={styles.grid}>
          {GLOWBUGS.map((bug) => {
            const times = rescued.get(bug.id) ?? 0;
            return (
              <li key={bug.id}>
                {times ? (
                  <button
                    type="button"
                    className={styles.bug}
                    onClick={() => setMeeting(bug)}
                    aria-label={`${bug.name} the ${bug.title}${times > 1 ? `, rescued ${times} times` : ''}`}
                  >
                    <GlowbugArt id={bug.id} size={64} />
                    <span className={styles.name}>{bug.name}</span>
                    {times > 1 && <span className={styles.times}>×{times}</span>}
                  </button>
                ) : (
                  <span className={`${styles.bug} ${styles.missing}`} role="img" aria-label={`Not found yet${bug.rare ? ', a rare one' : ''}`}>
                    <GlowbugArt id={bug.id} size={64} isSilhouette />
                    <span className={styles.name}>{bug.rare ? '★ Rare' : '?'}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </main>
      <BottomNav active="pals" />
      {meeting && (
        <Dialog title={meeting.name} tone="celebrate" onClose={() => setMeeting(null)}>
          <div className={styles.meet}>
            <GlowbugArt id={meeting.id} size={140} />
          </div>
          <p className={styles.title}>
            {meeting.title}
            {meeting.rare && <span className={styles.rare}> · ★ Rare</span>}
          </p>
          <p className={styles.bio}>{meeting.bio}</p>
          <Button onClick={() => setMeeting(null)} data-autofocus>
            Hi, {meeting.name}!
          </Button>
        </Dialog>
      )}
    </div>
  );
}
