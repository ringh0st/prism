import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { BEAM_THEMES, totalStars } from '../../game/progress.js';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './BeamStyles.module.css';

/**
 * The light's color: each style is a little lamp shining its glowing beam. The one in use wears a check,
 * locked ones show a lock and the ★ they need. Your own ★ count sits by the heading.
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
              {/* A little lamp shining its beam, in this style's color (only light glows in this game) */}
              <svg className={styles.beam} viewBox="0 0 120 36" style={{ '--beam': theme.color }} aria-hidden="true" focusable="false">
                <line className={styles.glow} x1="22" y1="18" x2="112" y2="18" />
                <line className={styles.ray} x1="22" y1="18" x2="112" y2="18" />
                <circle className={styles.lamp} cx="14" cy="18" r="10" />
                <circle className={styles.bulb} cx="14" cy="18" r="4.5" />
              </svg>
              {isSelected && (
                <span className={styles.check} aria-hidden="true">
                  <Icon name="check" size={16} strokeWidth={3} />
                </span>
              )}
              {!isUnlocked && (
                <span className={`game-title ${styles.need}`} aria-hidden="true">
                  <Icon name="lock" size={14} />
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
