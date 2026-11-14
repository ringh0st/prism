import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import styles from './OutOfMovesDialog.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';

/**
 * Shown when the move limit runs out before every gem is lit. Kept light and quick:
 * the board stays visible, retrying is one tap, and a hint is offered as a gentle way forward.
 * In the early worlds `onKeepGoing` adds a few moves instead (for 1 star), so new players never hit a wall.
 */
export default function OutOfMovesDialog({
  gemsLeft,
  gemsLit = 0,
  lumiLine,
  hintsOwned = 0,
  backName = 'map',
  onRetry,
  onKeepGoing = null,
  onRetryWithHint = null,
  onMap,
}) {
  const { t } = useI18n();
  const isClose = gemsLit > 0 && gemsLeft === 1;
  return (
    <Dialog title={t(isClose ? 'out.close' : 'out.title')} tone="gentle" onClose={onMap} closesOnBackdrop={false}>
      <p className={styles.progress}>
        {gemsLit === 0 ? t('out.noneLit') : t('out.gemsToGo', { count: gemsLeft })}{' '}
        <span className={styles.quip}>{t('lumi.says', { line: lumiLine })}</span>
      </p>
      <div className={styles.actions}>
        {onKeepGoing && (
          <Button size="lg" icon="play" onClick={onKeepGoing} data-autofocus>
            {t('out.keepGoing')}
          </Button>
        )}
        <Button
          size={onKeepGoing ? 'md' : 'lg'}
          variant={onKeepGoing ? 'secondary' : 'primary'}
          icon="restart"
          onClick={onRetry}
          data-autofocus={!onKeepGoing || undefined}
        >
          {t('out.tryAgain')}
        </Button>
        {onRetryWithHint && (
          <Button variant="secondary" icon="hint" onClick={onRetryWithHint}>
            {hintsOwned > 0 ? t('out.tryWithHintLeft', { count: hintsOwned }) : t('out.tryWithHint')}
          </Button>
        )}
        <Button variant="ghost" icon="map" onClick={onMap}>
          {t('play.backTo', { place: backName })}
        </Button>
      </div>
    </Dialog>
  );
}
