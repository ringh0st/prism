import PalArt from '../../components/pals/PalArt.jsx';
import Icon from '../../components/Icon.jsx';
import PalPowerBadge from '../../components/pals/PalPowerBadge.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { palName } from '../../i18n/palText.js';
import styles from './PalPowerChip.module.css';

/**
 * On the level card: your partner Pal and the power it brings to this level ("Ember +2 moves"). With `onSwitch`
 * it's a button that opens your other Pals, to bring a different power.
 */
export default function PalPowerChip({ help, wearing, onSwitch = null, isSwitching = false }) {
  const { t, lang } = useI18n();
  const name = palName(lang, help.pal);
  const label = t('power.chip', { name, power: t(`power.${help.id}.line`, { count: help.amount }) });
  const content = (
    <>
      <span className={styles.pal} aria-hidden="true">
        <PalArt palId={help.pal.id} stage={help.stage} wearing={wearing} size={44} portrait />
      </span>
      <PalPowerBadge power={help} />
      {onSwitch && <Icon name="dots" size={18} className={styles.more} />}
    </>
  );
  if (!onSwitch) {
    return (
      <p className={styles.chip} role="img" aria-label={label}>
        {content}
      </p>
    );
  }
  return (
    <button
      type="button"
      className={`${styles.chip} ${styles.button}`}
      onClick={onSwitch}
      aria-expanded={isSwitching}
      aria-label={`${label}. ${t('power.switch')}`}
    >
      {content}
    </button>
  );
}
