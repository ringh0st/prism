import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { RUSH_LENGTH } from '../../game/rush.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { withParts } from '../../i18n/extrasText.js';
import styles from './RushDialogs.module.css';

/**
 * A Light Rush puzzle solved: what it cost in spare moves (or the bonus it earned), milestone sparks,
 * and on to the next one. `outcome` comes from the route's onSolved.
 */
export default function RushClearedDialog({ number, par, moves, spareBefore, outcome, onNext, onBack }) {
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
      <p className={styles.summary}>{used === 0 ? t('rush.cleared.inPar', { par }) : t('rush.cleared.used', { moves, par, count: used })}</p>
      <div className={styles.spare}>
        <Icon name="bolt" size={26} />
        <span className={`game-title ${styles.spareCount}`}>{next.spare}</span>
        <span className={styles.spareLabel}>{t('rush.cleared.spareLeft')}</span>
        {change !== 0 && (
          <span className={`${styles.change} ${change > 0 ? styles.gain : styles.loss}`}>
            {change > 0 ? t('rush.cleared.bonus', { n: change }) : `−${-change}`}
          </span>
        )}
      </div>
      <p className={styles.progress}>{withParts(t('rush.cleared.progress', { total: RUSH_LENGTH }), { cleared: <strong>{next.cleared}</strong> })}</p>
      {sparksWon > 0 && (
        <p className={`game-title ${styles.reward}`}>
          <Icon name="spark" size={20} /> {t('rush.cleared.milestone', { n: sparksWon })}
        </p>
      )}
      {isComplete && isNewBest && <p className={styles.best}>{t('rush.cleared.legend')}</p>}
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
