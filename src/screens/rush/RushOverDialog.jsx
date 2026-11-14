import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import { RUSH_LENGTH } from '../../game/rush.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './RushDialogs.module.css';

/** Out of moves in Light Rush: how far the run got (a big number), a crown for a new best, and a new run one tap away. */
export default function RushOverDialog({ cleared, isNewBest, onNewRun, onBack }) {
  const { t } = useI18n();
  return (
    <Dialog title={t('rush.over.title')} onClose={onBack} closesOnBackdrop={false}>
      <div className={styles.over}>
        <Lumi mood={cleared >= 10 ? 'excited' : 'happy'} size={84} />
        <p className={styles.final} aria-label={t('rush.over.cleared', { cleared, total: RUSH_LENGTH })}>
          <span className={`game-title ${styles.finalCount}`} aria-hidden="true">
            {cleared}
          </span>
          <span className={styles.finalOf} aria-hidden="true">
            /{RUSH_LENGTH}
          </span>
        </p>
      </div>
      {isNewBest && cleared > 0 && (
        <p className={`game-title ${styles.best}`}>
          <Icon name="crown" size={22} /> {t('rush.over.newBest')}
        </p>
      )}
      <div className={styles.actions}>
        <Button size="lg" icon="bolt" onClick={onNewRun} data-autofocus>
          {t('rush.over.newRun')}
        </Button>
        <Button variant="ghost" onClick={onBack}>
          {t('rush.back')}
        </Button>
      </div>
    </Dialog>
  );
}
