import { PAL_GROWTH_LEVELS, growthOf, palStage, stageOf } from '../../game/pals.js';
import styles from './PalGrowthBar.module.css';
import { palName, stageName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

/** How close a Pal is to its next form: it grows by one for every level solved while it's your partner. */
export default function PalGrowthBar({ pal, owned, showLine = true }) {
  const { t, lang } = useI18n();
  const stage = palStage(stageOf(owned));
  const name = palName(lang, pal);
  const next = stage.next && stageName(lang, stage.next);
  const growth = stage.next ? growthOf(owned) : PAL_GROWTH_LEVELS;
  const percent = Math.round((growth / PAL_GROWTH_LEVELS) * 100);
  return (
    <div className={styles.box}>
      <div className={styles.head}>
        <span>{next ? t('pals.growth.next', { stage: next }) : stageName(lang, stage)}</span>
        <span className={styles.count}>
          {growth}/{PAL_GROWTH_LEVELS}
        </span>
      </div>
      <div
        className={`${styles.track} ${stage.next ? '' : styles.full}`}
        role="progressbar"
        aria-label={next ? t('pals.growth.label', { name, stage: next }) : t('pals.growth.fullLabel', { name })}
        aria-valuemin={0}
        aria-valuemax={PAL_GROWTH_LEVELS}
        aria-valuenow={growth}
        aria-valuetext={t('pals.growth.value', { n: growth, total: PAL_GROWTH_LEVELS })}
      >
        <span className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      {showLine && (
        <p className={styles.line}>
          {next ? t('pals.growth.left', { count: PAL_GROWTH_LEVELS - growth, name, stage: next }) : t('pals.growth.full', { name })}
        </p>
      )}
    </div>
  );
}
