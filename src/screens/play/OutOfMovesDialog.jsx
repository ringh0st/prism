import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import TargetIcon from '../../components/game/TargetIcon.jsx';
import TapIcon from './TapIcon.jsx';
import styles from './OutOfMovesDialog.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';

/**
 * Shown when the move limit runs out before every gem is lit. Kept light and quick: the gems show what's
 * missing (lit ones ticked, dark ones waiting with a "?"), retrying is one big tap, a hint is offered as a gentle
 * way forward. In the early worlds `onKeepGoing` adds `extraMoves` instead (for 1 star), so new players never hit a wall.
 * @param gems [{ color, isLit }] for every gem on the board
 * @param darkKind when the darkness won instead (darkness.js): 'swallowed' | 'faded' | 'lampOut'
 */
export default function OutOfMovesDialog({
  gems,
  darkKind = null,
  extraMoves = 0,
  backName = 'map',
  onRetry,
  onKeepGoing = null,
  onRetryWithHint = null,
  onMap,
}) {
  const { t } = useI18n();
  const gemsLit = gems.filter((gem) => gem.isLit).length;
  const gemsLeft = gems.length - gemsLit;
  const isClose = gemsLit > 0 && gemsLeft === 1;
  return (
    <Dialog title={t(darkKind ? `out.dark.${darkKind}` : isClose ? 'out.close' : 'out.title')} tone="gentle" onClose={onMap} closesOnBackdrop={false}>
      <ul className={styles.gems} aria-label={gemsLit === 0 ? t('out.noneLit') : t('out.gemsToGo', { count: gemsLeft })}>
        {gems.map((gem, i) => (
          <li key={i} className={gem.isLit ? styles.lit : styles.missing} style={{ '--i': i }}>
            <TargetIcon color={gem.color} size={40} />
            <span className={styles.mark} aria-hidden="true">
              {gem.isLit ? <Icon name="check" size={14} strokeWidth={3.4} /> : '?'}
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.actions}>
        {onKeepGoing && (
          <Button size="lg" onClick={onKeepGoing} data-autofocus aria-label={t('out.keepGoing', { count: extraMoves })}>
            <span className={styles.keepGoing} aria-hidden="true">
              <span dir="ltr">+{extraMoves}</span>
              <TapIcon size={24} />
              <span className={styles.cap}>★☆☆</span>
            </span>
          </Button>
        )}
        <Button size="lg" variant={onKeepGoing ? 'secondary' : 'primary'} icon="restart" onClick={onRetry} data-autofocus={!onKeepGoing || undefined}>
          {t('out.tryAgain')}
        </Button>
        <div className={styles.row}>
          {onRetryWithHint && (
            <Button variant="secondary" icon="hint" onClick={onRetryWithHint} aria-label={t('out.tryWithHint')}>
              {t('helpers.short.hint')}
            </Button>
          )}
          <Button variant="secondary" icon="map" onClick={onMap} aria-label={t('play.backTo', { place: backName })}>
            {backName === t('place.map') ? t('nav.map') : backName}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
