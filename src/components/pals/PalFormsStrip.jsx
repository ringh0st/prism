import PalArt from './PalArt.jsx';
import Icon from '../Icon.jsx';
import PalPowerBadge from './PalPowerBadge.jsx';
import { PAL_STAGES, palById } from '../../game/pals.js';
import { palPower } from '../../game/palPowers.js';
import stageStyles from './PalStage.module.css';
import styles from './PalFormsStrip.module.css';
import { stageName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

/**
 * All five forms of a Pal in a row, Baby to Master, each with its power at that form (so you can see it
 * grow stronger). Forms after `revealedUpTo` are mystery silhouettes
 * (with a lock, so it's not color alone). With `onSelect`, each form is a button to look at it.
 */
export default function PalFormsStrip({ palId, current = 0, revealedUpTo = PAL_STAGES.length - 1, selected = null, onSelect = null }) {
  const { t, lang } = useI18n();
  const pal = palById(palId);
  return (
    <ol className={styles.strip} aria-label={t('pals.forms.label')}>
      {PAL_STAGES.map((stage, index) => {
        const isHidden = index > revealedUpTo;
        const name = isHidden ? '???' : stageName(lang, stage);
        const formLabel = isHidden ? t('pals.forms.mystery') : name;
        const content = (
          <>
            <span className={`${styles.art} ${isHidden ? '' : `${stageStyles.backdrop} ${stageStyles[stage.id]}`}`}>
              <PalArt palId={palId} stage={index} size={52} portrait className={isHidden ? styles.silhouette : ''} />
              {isHidden && <Icon name="lock" size={14} className={styles.lock} />}
            </span>
            <span>{name}</span>
            {pal && <PalPowerBadge power={palPower(pal, index)} size="sm" />}
          </>
        );
        const className = `${styles.form} ${index === current ? styles.current : ''} ${index === selected ? styles.selected : ''}`;
        return (
          <li key={stage.id}>
            {onSelect ? (
              <button
                type="button"
                className={className}
                onClick={() => onSelect(index)}
                aria-pressed={index === selected}
                aria-label={index === current ? t('pals.forms.now', { form: formLabel }) : formLabel}
              >
                {content}
              </button>
            ) : (
              <div className={className}>{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
