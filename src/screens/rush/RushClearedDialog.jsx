import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import Stars from '../../components/Stars.jsx';
import { RUSH_LENGTH } from '../../game/rush.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './RushDialogs.module.css';

/**
 * A Light Rush puzzle solved: ★★★ when it cost no spares, the spare moves left (with what changed),
 * milestone sparks, how far along the run is, and on to the next one. `outcome` comes from the route's onSolved.
 */
export default function RushClearedDialog({ number, par, moves, stars, spareBefore, outcome, onNext, onBack }) {
  const { t } = useI18n();
  const { next, sparksWon, isComplete, isNewBest } = outcome;
  const used = Math.max(0, moves - par);
  const change = next.spare - spareBefore;
  return (
    <Dialog
      title={isComplete ? t('rush.cleared.all', { total: RUSH_LENGTH }) : t('rush.cleared.puzzle', { n: number })}
      tone="celebrate"
      onClose={onBack}
      closesOnBackdrop={false}
    >
      <p className="visually-hidden">{used === 0 ? t('rush.cleared.inPar', { par }) : t('rush.cleared.used', { moves, par, count: used })}</p>
      {/* The same stars the meter shows (★★★ when no spare move was needed) */}
      {stars === 3 && used === 0 && <Stars count={3} size={34} animate className={styles.stars} />}
      <div className={styles.spare} role="img" aria-label={`${next.spare} ${t('rush.cleared.spareLeft')}`}>
        <Icon name="bolt" size={30} />
        <span className={`game-title ${styles.spareCount}`}>{next.spare}</span>
        {change !== 0 && (
          <span className={`${styles.change} ${change > 0 ? styles.gain : styles.loss}`}>{change > 0 ? `+${change}` : `−${-change}`}</span>
        )}
      </div>
      <div
        className={styles.progress}
        role="progressbar"
        aria-label={t('rush.cleared.progress', { cleared: next.cleared, total: RUSH_LENGTH })}
        aria-valuemin={0}
        aria-valuemax={RUSH_LENGTH}
        aria-valuenow={next.cleared}
      >
        <span className={styles.progressFill} style={{ width: `${(next.cleared / RUSH_LENGTH) * 100}%` }} />
        <span className={styles.progressText} aria-hidden="true">
          {next.cleared}/{RUSH_LENGTH}
        </span>
      </div>
      {sparksWon > 0 && (
        <p className={`game-title ${styles.reward}`} aria-label={t('rush.cleared.milestone', { n: sparksWon })}>
          <Icon name="gift" size={22} />
          <span aria-hidden="true">+{sparksWon}</span>
          <Icon name="spark" size={20} />
        </p>
      )}
      {isComplete && isNewBest && (
        <p className={`game-title ${styles.best}`}>
          <Icon name="crown" size={22} /> {t('rush.over.newBest')}
        </p>
      )}
      <div className={styles.actions}>
        {isComplete ? (
          <Button size="lg" onClick={onBack} data-autofocus>
            {t('rush.back')}
          </Button>
        ) : (
          <Button size="lg" icon="play" onClick={onNext} data-autofocus>
            {t('rush.next')}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
