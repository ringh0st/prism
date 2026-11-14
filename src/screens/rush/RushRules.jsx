import Icon from '../../components/Icon.jsx';
import HelpTip from '../../components/game/HelpTip.jsx';
import { RUSH_BONUS_EVERY, RUSH_BONUS_SPARE, RUSH_LENGTH, RUSH_START_SPARE } from '../../game/rush.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './RushRules.module.css';

/** Four little puzzle tiles: "puzzles". */
function Tiles() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" opacity="0.45" />
    </svg>
  );
}

/** The hint bulb, crossed out: "no helpers". */
function NoHelpers() {
  return (
    <span className={styles.crossed} aria-hidden="true">
      <Icon name="hint" size={22} />
    </span>
  );
}

/**
 * The rules of the run as four picture chips with big numbers (30 puzzles, 12 spare moves, +3 every 5,
 * no helpers). The full sentences are behind the "?".
 */
export default function RushRules() {
  const { t } = useI18n();
  const rules = [
    { id: 'length', art: <Tiles />, value: RUSH_LENGTH, label: t('rush.chip.puzzles'), text: t('rush.rule.length', { total: RUSH_LENGTH }) },
    {
      id: 'spare',
      art: <Icon name="bolt" size={22} />,
      value: RUSH_START_SPARE,
      label: t('rush.chip.spare'),
      text: t('rush.rule.spare', { spare: RUSH_START_SPARE }),
    },
    {
      id: 'bonus',
      art: <Icon name="gift" size={22} />,
      value: `+${RUSH_BONUS_SPARE}`,
      label: t('rush.chip.bonus', { every: RUSH_BONUS_EVERY }),
      text: t('rush.rule.bonus', { bonus: RUSH_BONUS_SPARE, every: RUSH_BONUS_EVERY }),
    },
    { id: 'noHelpers', art: <NoHelpers />, value: null, label: t('rush.chip.noHelpers'), text: t('rush.rule.noHelpers') },
  ];
  return (
    <div className={styles.rules}>
      <ul className={styles.chips}>
        {rules.map((rule) => (
          <li key={rule.id} className={`${styles.chip} ${styles[rule.id]}`} aria-label={rule.text}>
            <span className={styles.art} aria-hidden="true">
              {rule.art}
              {rule.value !== null && <span className={`game-title ${styles.value}`}>{rule.value}</span>}
            </span>
            <span className={styles.label} aria-hidden="true">
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
      <HelpTip title={t('rush.howTitle')}>
        <ul>
          {rules.map((rule) => (
            <li key={rule.id}>{rule.text}</li>
          ))}
          <li>{t('rush.footnote')}</li>
        </ul>
      </HelpTip>
    </div>
  );
}
