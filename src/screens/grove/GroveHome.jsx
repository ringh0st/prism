import Button from '../../components/Button.jsx';
import GroveScene from '../../components/grove/GroveScene.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { finishedWorldCount } from '../../game/titles.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './Grove.module.css';

/** The Grove on the Pals screen: where your Pals live, and the way into decorating it. */
export default function GroveHome() {
  const { progress } = usePlayer();
  const { t } = useI18n();
  const isBare = progress.grove.placed.length === 0;
  return (
    <section className={styles.home} aria-labelledby="grove-title">
      <div className={styles.homeHead}>
        <div>
          <h2 id="grove-title" className="game-title">
            {t('grove.title')}
          </h2>
          <p className={styles.lead}>{isBare ? t('grove.leadBare') : t('grove.lead')}</p>
        </div>
        <Button as="a" href="#/grove" size="sm" icon="home">
          {t('grove.decorate')}
        </Button>
      </div>
      <GroveScene
        placed={progress.grove.placed}
        partnerId={progress.pal.id}
        owned={progress.pal.owned}
        wearing={progress.pal.wearing}
        worldsFinished={finishedWorldCount(progress.levels)}
      />
    </section>
  );
}
