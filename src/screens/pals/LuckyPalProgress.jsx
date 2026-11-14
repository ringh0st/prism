import Icon from '../../components/Icon.jsx';
import HelpTip from '../../components/game/HelpTip.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { LUCKY_PAL_EVERY, LUCKY_PAL_ODDS, solvedLevelCount } from '../../game/pals.js';
import styles from './LuckyPal.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';

const percent = (share) => `${Math.round(share * 100)}%`;
/** Each rarity's symbol (shape, not color alone): a paw for Basic, ★ Legendary, ✦ Mythic. */
const ODDS = [
  { id: 'common', symbol: <Icon name="paw" size={13} /> },
  { id: 'legendary', symbol: '★' },
  { id: 'mythic', symbol: '✦' },
];

/** How close the next Lucky Pal gift is (a bar that ends in the gift), and its odds as symbols and percentages. */
export default function LuckyPalProgress() {
  const { progress } = usePlayer();
  const { t } = useI18n();
  const toward = solvedLevelCount(progress.levels) % LUCKY_PAL_EVERY;
  const oddsText = t('pals.lucky.odds', {
    common: percent(LUCKY_PAL_ODDS.common),
    legendary: percent(LUCKY_PAL_ODDS.legendary),
    mythic: percent(LUCKY_PAL_ODDS.mythic),
  });
  return (
    <section className={styles.card} aria-labelledby="lucky-title">
      <div className={styles.head}>
        <h2 id="lucky-title" className="game-title">
          {t('pals.lucky.title')}
        </h2>
        <HelpTip title={t('pals.lucky.title')}>
          <p>{t('pals.lucky.line', { every: LUCKY_PAL_EVERY, left: LUCKY_PAL_EVERY - toward })}</p>
          <p>{oddsText}</p>
        </HelpTip>
      </div>
      <div className={styles.road}>
        <div
          className={styles.track}
          role="progressbar"
          aria-label={t('pals.lucky.progressLabel')}
          aria-valuemin={0}
          aria-valuemax={LUCKY_PAL_EVERY}
          aria-valuenow={toward}
        >
          <span className={styles.fill} style={{ width: `${(toward / LUCKY_PAL_EVERY) * 100}%` }} />
          <span className={styles.count} aria-hidden="true">
            {toward}/{LUCKY_PAL_EVERY}
          </span>
        </div>
        <span className={styles.icon} aria-hidden="true">
          <Icon name="gift" size={26} />
        </span>
      </div>
      <ul className={styles.odds} aria-label={oddsText}>
        {ODDS.map((odd) => (
          <li key={odd.id} className={`${styles.odd} ${styles[odd.id]}`} aria-hidden="true">
            <span className={styles.symbol}>{odd.symbol}</span>
            {percent(LUCKY_PAL_ODDS[odd.id])}
          </li>
        ))}
      </ul>
    </section>
  );
}
