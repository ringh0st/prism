import Button from '../../components/Button.jsx';
import GroveScene from '../../components/grove/GroveScene.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { stageOf } from '../../game/pals.js';
import styles from './Grove.module.css';

/** The Grove on the Pals screen: where your Pals live, and the way into decorating it. */
export default function GroveHome() {
  const { progress } = usePlayer();
  const isBare = progress.grove.placed.length === 0;
  return (
    <section className={styles.home} aria-labelledby="grove-title">
      <div className={styles.homeHead}>
        <div>
          <h2 id="grove-title" className="game-title">
            The Grove
          </h2>
          <p className={styles.lead}>
            {isBare ? 'Your partner’s home in the enchanted forest. Make it cozy!' : 'Your partner’s home in the enchanted forest. Tap to say hi.'}
          </p>
        </div>
        <Button as="a" href="#/grove" size="sm" icon="home">
          Decorate
        </Button>
      </div>
      <GroveScene placed={progress.grove.placed} partnerId={progress.pal.id} stage={stageOf(progress.pal.owned[progress.pal.id])} wearing={progress.pal.wearing} />
    </section>
  );
}
