import Icon from '../Icon.jsx';
import PalArt from './PalArt.jsx';
import { PAL_GROWTH_LEVELS, growthOf, palStage, stageOf } from '../../game/pals.js';
import stageStyles from './PalStage.module.css';
import styles from './PalGrowthBar.module.css';
import { palName, stageName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

/**
 * How close a Pal is to its next form (one step per level solved as partner): a bar that ends in the next
 * form's silhouette. A fully grown Pal gets a crown instead of a bar. Words are for screen readers.
 * @param onNext makes the silhouette a button (e.g. to open all the forms)
 */
export default function PalGrowthBar({ pal, owned, onNext }) {
  const { t, lang } = useI18n();
  const stage = palStage(stageOf(owned));
  const name = palName(lang, pal);

  if (!stage.next) {
    return (
      <div className={styles.grown}>
        <span className={styles.crown} aria-hidden="true">
          <Icon name="crown" size={22} />
        </span>
        <span className="visually-hidden">{t('pals.growth.full', { name })}</span>
      </div>
    );
  }

  const next = stageName(lang, stage.next);
  const growth = growthOf(owned);
  const silhouette = (
    <span className={`${styles.next} ${stageStyles.backdrop} ${stageStyles[stage.next.id]}`}>
      <PalArt palId={pal.id} stage={stage.index + 1} size={34} portrait className={styles.silhouette} />
    </span>
  );
  return (
    <div className={styles.box}>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={t('pals.growth.label', { name, stage: next })}
        aria-valuemin={0}
        aria-valuemax={PAL_GROWTH_LEVELS}
        aria-valuenow={growth}
        aria-valuetext={t('pals.growth.value', { n: growth, total: PAL_GROWTH_LEVELS })}
      >
        <span className={styles.fill} style={{ width: `${(growth / PAL_GROWTH_LEVELS) * 100}%` }} />
        <span className={styles.count} aria-hidden="true">
          {growth}/{PAL_GROWTH_LEVELS}
        </span>
      </div>
      {onNext ? (
        <button type="button" className={styles.nextButton} onClick={onNext} aria-label={t('pals.partner.forms')}>
          {silhouette}
        </button>
      ) : (
        <span aria-hidden="true">{silhouette}</span>
      )}
    </div>
  );
}
