import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import LumiSays from '../../components/game/LumiSays.jsx';
import { RUSH_LENGTH } from '../../game/rush.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { withParts } from '../../i18n/extrasText.js';
import styles from './RushDialogs.module.css';

const lineFor = (cleared) => (cleared === 0 ? 'rush.over.lineNone' : cleared < 10 ? 'rush.over.lineSome' : 'rush.over.lineGreat');

/** Out of moves in Light Rush: the run ends, with how far it got, and a new run is one tap away. */
export default function RushOverDialog({ cleared, isNewBest, onNewRun, onBack }) {
  const { t } = useI18n();
  return (
    <Dialog title={t('rush.over.title')} onClose={onBack} closesOnBackdrop={false}>
      <p className={styles.final}>
        {withParts(t('rush.over.cleared', { total: RUSH_LENGTH }), { cleared: <span className={`game-title ${styles.finalCount}`}>{cleared}</span> })}
      </p>
      {isNewBest && cleared > 0 && <p className={styles.best}>{t('rush.over.newBest')}</p>}
      <LumiSays mood="happy" size={64} line={t(lineFor(cleared))} />
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
