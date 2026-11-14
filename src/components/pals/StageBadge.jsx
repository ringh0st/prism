import stageStyles from './PalStage.module.css';
import { stageName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

/** A growth stage's name ("Buddy") as a tag in that stage's own color. */
export default function StageBadge({ stage, className = '' }) {
  const { lang } = useI18n();
  return <span className={`${stageStyles.badge} ${stageStyles[stage.id]} ${className}`}>{stageName(lang, stage)}</span>;
}
