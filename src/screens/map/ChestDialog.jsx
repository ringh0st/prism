import GiftReveal from '../../components/gifts/GiftReveal.jsx';
import LumiSays from '../../components/game/LumiSays.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './ChestDialog.module.css';

/**
 * Opening a reward chest on the map: tap it, it shakes and bursts open, and the treasure comes out.
 * @param opening the claim promise, started when the player tapped the chest on the map (so it runs exactly once)
 */
export default function ChestDialog({ opening, onClose }) {
  const { t } = useI18n();
  return (
    <GiftReveal title={t('ui.chest.title')} doneTitle={t('ui.chest.treasure')} wrapping={{ kind: 'chest' }} open={() => opening} onClose={onClose}>
      <div className={styles.lumi}>
        <LumiSays mood="dance" size={92} line={t('ui.chest.lumi')} />
      </div>
    </GiftReveal>
  );
}
