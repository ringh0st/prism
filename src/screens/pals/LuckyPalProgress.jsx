import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { LUCKY_PAL_EVERY, LUCKY_PAL_ODDS, solvedLevelCount } from '../../game/pals.js';
import styles from './LuckyPal.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';

const percent = (share) => `${Math.round(share * 100)}%`;

/** How close the next Lucky Pal gift is, and its odds (free gifts still show their odds). */
export default function LuckyPalProgress() {
  const { progress } = usePlayer();
  const { t } = useI18n();
  const toward = solvedLevelCount(progress.levels) % LUCKY_PAL_EVERY;
  return (
    <section className={styles.card} aria-labelledby="lucky-title">
      <span className={styles.icon} aria-hidden="true">
        <Icon name="gift" size={26} />
      </span>
      <div className={styles.body}>
        <h2 id="lucky-title" className="game-title">
          {t('pals.lucky.title')}
        </h2>
        <p className={styles.line}>{t('pals.lucky.line', { every: LUCKY_PAL_EVERY, left: LUCKY_PAL_EVERY - toward })}</p>
        <div
          className={styles.track}
          role="progressbar"
          aria-label={t('pals.lucky.progressLabel')}
          aria-valuemin={0}
          aria-valuemax={LUCKY_PAL_EVERY}
          aria-valuenow={toward}
        >
          <span className={styles.fill} style={{ width: `${(toward / LUCKY_PAL_EVERY) * 100}%` }} />
        </div>
        <p className={styles.odds}>
          {t('pals.lucky.odds', {
            common: percent(LUCKY_PAL_ODDS.common),
            legendary: percent(LUCKY_PAL_ODDS.legendary),
            mythic: percent(LUCKY_PAL_ODDS.mythic),
          })}
        </p>
      </div>
    </section>
  );
}
