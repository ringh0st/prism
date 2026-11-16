import PalArt from '../../components/pals/PalArt.jsx';
import PalPowerBadge from '../../components/pals/PalPowerBadge.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { palName } from '../../i18n/palText.js';
import styles from './PalPowerChip.module.css';

/** On the level card: your partner Pal and the power it brings to this level ("Ember +2 moves"). */
export default function PalPowerChip({ help, wearing }) {
  const { t, lang } = useI18n();
  const name = palName(lang, help.pal);
  return (
    <p className={styles.chip} role="img" aria-label={t('power.chip', { name, power: t(`power.${help.id}.line`, { count: help.amount }) })}>
      <span className={styles.pal} aria-hidden="true">
        <PalArt palId={help.pal.id} stage={help.stage} wearing={wearing} size={44} portrait />
      </span>
      <PalPowerBadge power={help} />
    </p>
  );
}
