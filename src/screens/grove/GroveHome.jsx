import Button from '../../components/Button.jsx';
import GroveScene from '../../components/grove/GroveScene.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS } from '../../game/pals.js';
import styles from './Grove.module.css';

/** The Pals' team, with each Pal's saved form, for the Grove scene. */
export function useGroveTeam() {
  const { progress } = usePlayer();
  return PALS.filter((pal) => progress.pal.owned[pal.id]).map((pal) => ({ id: pal.id, owned: progress.pal.owned[pal.id] }));
}

/** The Grove on the Pals screen: where your Pals live, and the way into decorating it. */
export default function GroveHome() {
  const { progress } = usePlayer();
  const team = useGroveTeam();
  const isBare = progress.grove.placed.length === 0;
  return (
    <section className={styles.home} aria-labelledby="grove-title">
      <div className={styles.homeHead}>
        <div>
          <h2 id="grove-title" className="game-title">
            The Grove
          </h2>
          <p className={styles.lead}>
            {isBare ? 'Your Pals’ home in the enchanted forest. Make it cozy!' : 'Your Pals’ home in the enchanted forest. Tap a Pal to say hi.'}
          </p>
        </div>
        <Button as="a" href="#/grove" size="sm" icon="home">
          Decorate
        </Button>
      </div>
      <GroveScene placed={progress.grove.placed} team={team} partnerId={progress.pal.id} wearing={progress.pal.wearing} />
    </section>
  );
}
