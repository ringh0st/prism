import GlowbugArt from '../../components/glowbugs/GlowbugArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { GLOWBUGS, rescuedGlowbugs } from '../../game/glowbugs.js';
import styles from './GlowbugGardenLink.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';

/** The way into the Glowbug Garden from the Pals screen, with how many you've found. */
export default function GlowbugGardenLink() {
  const { progress } = usePlayer();
  const { t } = useI18n();
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
        <strong className="game-title">{t('pals.garden.title')}</strong>
        <span className={styles.count} aria-hidden="true">
          {rescued.size}/{GLOWBUGS.length}
        </span>
        <span className="visually-hidden">{t('pals.garden.found', { n: rescued.size, total: GLOWBUGS.length })}</span>
      </span>
      <span className={styles.go} aria-hidden="true">
        ›
      </span>
    </a>
  );
}
