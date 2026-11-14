import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { BEAM_THEMES, totalStars } from '../../game/progress.js';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './BeamStyles.module.css';

/**
 * The light's color, as glowing swatches: the one in use wears a check, locked ones a lock and the
 * ★ they need. Your own ★ count sits by the heading.
 */
export default function BeamStyles({ className = '' }) {
  const { progress, setBeamTheme } = usePlayer();
  const { t } = useI18n();
  const stars = totalStars(progress);
  const pick = (theme) => {
    if (stars < theme.starsToUnlock) {
      sfx.locked();
      return;
    }
    sfx.tap();
    setBeamTheme(theme.id);
  };
  return (
    <section className={className} aria-labelledby="beam-title">
      <div className={styles.head}>
        <h2 id="beam-title">{t('me.beam.title')}</h2>
        <span className={`game-title ${styles.have}`} aria-label={t('me.beam.have', { stars })}>
          <Icon name="star" size={16} />
          <span aria-hidden="true">{stars}</span>
        </span>
      </div>
      <div className={styles.swatches} role="radiogroup" aria-labelledby="beam-title">
        {BEAM_THEMES.map((theme) => {
          const isUnlocked = stars >= theme.starsToUnlock;
          const isSelected = progress.beamTheme === theme.id;
          const name = t(`beam.${theme.id}`, {}, theme.name);
          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={!isUnlocked}
              aria-label={isUnlocked ? name : `${name}, ${t('me.beam.needs', { n: theme.starsToUnlock })}`}
              className={`${styles.swatch} ${isSelected ? styles.selected : ''} ${isUnlocked ? '' : styles.locked}`}
              onClick={() => pick(theme)}
            >
              <span className={styles.light} style={{ '--beam': theme.color }} aria-hidden="true">
                {isSelected && <Icon name="check" size={22} strokeWidth={3} />}
                {!isUnlocked && <Icon name="lock" size={18} />}
              </span>
              {!isUnlocked && (
                <span className={`game-title ${styles.need}`} aria-hidden="true">
                  <Icon name="star" size={12} />
                  {theme.starsToUnlock}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
